/**
 * @file shiprocket.service.ts
 * @layer Infrastructure › Services
 * @description Official Shiprocket Courier API Integration Service.
 * Handles Authentication, Token Caching, Order Creation, AWB Generation,
 * Pickup Scheduling, Real-time Tracking, Label/Invoice Generation, Cancellations, and Reverse Returns.
 */

import axios, { AxiosInstance } from 'axios';
import { SettingsModel } from '../../../settings/infrastructure/models/settings.model';

export interface ShiprocketOrderItem {
  name: string;
  sku: string;
  units: number;
  selling_price: number;
  discount?: number;
  tax?: number;
}

export interface CreateShiprocketOrderParams {
  orderNumber: string;
  orderDate: Date;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: {
    address: string;
    address2?: string | null;
    city: string;
    state: string;
    country?: string | null;
    postalCode: string;
  };
  items: ShiprocketOrderItem[];
  paymentMethod: 'COD' | 'Prepaid';
  subtotal: number;
  length?: number;
  breadth?: number;
  height?: number;
  weight?: number; // in kg
  pickupLocation?: string;
}

export interface ShiprocketOrderResult {
  orderId: number;
  shipmentId: number;
  status: string;
  statusCode: number;
}

export interface ShiprocketAwbResult {
  awbCode: string;
  courierName: string;
  courierCompanyId: number;
}

export interface ShiprocketPickupResult {
  pickupStatus: number | string;
  pickupScheduledDate?: string;
  pickupTokenNumber?: string;
}

export interface ShiprocketTrackingActivity {
  date: string;
  status: string;
  activity: string;
  location: string;
  srStatus?: string;
}

export interface ShiprocketTrackingResult {
  trackingNumber: string;
  currentStatus: string;
  courierName?: string;
  estimatedDeliveryDate?: string | null;
  scans: ShiprocketTrackingActivity[];
  rawResponse?: any;
}

export class ShiprocketService {
  private static instance: ShiprocketService;
  private readonly baseUrl = 'https://apiv2.shiprocket.in/v1/external';
  private cachedToken: string | null = null;
  private tokenExpiresAt: number = 0;
  private http: AxiosInstance;

  private constructor() {
    this.http = axios.create({
      baseURL: this.baseUrl,
      timeout: 25000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  public static getInstance(): ShiprocketService {
    if (!ShiprocketService.instance) {
      ShiprocketService.instance = new ShiprocketService();
    }
    return ShiprocketService.instance;
  }

  /**
   * Retrieves active Shiprocket credentials from environment variables or database settings.
   */
  private async getCredentials(): Promise<{ email: string; password: string; pickupLocation: string }> {
    let email = process.env['SHIPROCKET_EMAIL']?.trim() || '';
    let password = process.env['SHIPROCKET_PASSWORD']?.trim() || '';
    let pickupLocation = process.env['SHIPROCKET_PICKUP_LOCATION_NAME']?.trim() || 'warehouse';

    try {
      const storeSetting = await SettingsModel.findOne({ key: 'store_config' }).lean();
      if (storeSetting?.value?.shiprocket) {
        if (storeSetting.value.shiprocket.email) email = storeSetting.value.shiprocket.email.trim();
        if (storeSetting.value.shiprocket.password) password = storeSetting.value.shiprocket.password.trim();
        if (storeSetting.value.shiprocket.pickupLocation) pickupLocation = storeSetting.value.shiprocket.pickupLocation.trim();
      }
    } catch {}

    if (!email || !password) {
      throw new Error('Shiprocket credentials missing. Please set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD.');
    }

    return { email, password, pickupLocation };
  }

  /**
   * Generates or returns a valid cached authentication bearer token (10-day lifespan).
   */
  public async getAuthToken(forceRefresh = false): Promise<string> {
    const now = Date.now();
    if (!forceRefresh && this.cachedToken && this.tokenExpiresAt > now + 3600 * 1000) {
      return this.cachedToken;
    }

    const { email, password } = await this.getCredentials();

    try {
      const response = await this.http.post('/auth/login', {
        email,
        password,
      });

      if (!response.data || !response.data.token) {
        throw new Error('Invalid response from Shiprocket Auth API: Token missing');
      }

      this.cachedToken = response.data.token;
      // Tokens are typically valid for 10 days (864000 seconds)
      this.tokenExpiresAt = now + 9 * 24 * 60 * 60 * 1000;
      return this.cachedToken!;
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to authenticate with Shiprocket';
      throw new Error(`Shiprocket Authentication Failed: ${errorMsg}`);
    }
  }

  /**
   * Generic authenticated HTTP request with automatic retry on token expiry.
   */
  private async request<T = any>(config: {
    method: 'get' | 'post' | 'put' | 'delete' | 'patch';
    url: string;
    data?: any;
    params?: any;
  }): Promise<T> {
    const token = await this.getAuthToken();
    try {
      const res = await this.http.request<T>({
        ...config,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(config as any).headers,
        },
      });
      return res.data;
    } catch (err: any) {
      if (err.response?.status === 401) {
        // Token might have been invalidated, refresh and retry once
        const freshToken = await this.getAuthToken(true);
        const retryRes = await this.http.request<T>({
          ...config,
          headers: {
            Authorization: `Bearer ${freshToken}`,
            ...(config as any).headers,
          },
        });
        return retryRes.data;
      }
      throw err;
    }
  }

  /**
   * Get all registered pickup addresses from Shiprocket.
   */
  public async getPickupLocations(): Promise<any[]> {
    const res = await this.request({
      method: 'get',
      url: '/settings/company/pickup',
    });
    return res?.data?.shipping_address || res?.data || [];
  }

  /**
   * Formats a Date object to 'YYYY-MM-DD HH:mm' required by Shiprocket.
   */
  private formatDateForShiprocket(date: Date): string {
    const d = new Date(date);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  /**
   * Creates an Adhoc Order in Shiprocket.
   */
  public async createAdhocOrder(params: CreateShiprocketOrderParams): Promise<ShiprocketOrderResult> {
    const creds = await this.getCredentials();
    const pickupLoc = params.pickupLocation || creds.pickupLocation || 'warehouse';

    // Format customer names safely
    const nameParts = (params.customerName || 'Valued Customer').trim().split(/\s+/);
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || '.';

    // Sanitized phone (must be 10 digits in India or numeric)
    const rawPhone = (params.customerPhone || '').replace(/\D/g, '');
    const phone = rawPhone.length > 10 ? rawPhone.slice(-10) : (rawPhone || '9876543210');

    // Clean address fields (Shiprocket requires min 10 chars for address)
    let addr1 = (params.shippingAddress.address || '').trim();
    if (addr1.length < 10) {
      addr1 = `${addr1}, Near Landmark, Pincode ${params.shippingAddress.postalCode}`;
    }

    const payload = {
      order_id: params.orderNumber,
      order_date: this.formatDateForShiprocket(params.orderDate || new Date()),
      pickup_location: pickupLoc,
      channel_id: '',
      comment: `Order #${params.orderNumber} via YOX Ecommerce`,
      billing_customer_name: firstName,
      billing_last_name: lastName,
      billing_address: addr1,
      billing_address_2: params.shippingAddress.address2 || '',
      billing_city: params.shippingAddress.city || 'Kannur',
      billing_pincode: params.shippingAddress.postalCode,
      billing_state: params.shippingAddress.state || 'Kerala',
      billing_country: params.shippingAddress.country || 'India',
      billing_email: params.customerEmail || 'orders@yox.com',
      billing_phone: phone,
      shipping_is_billing: true,
      order_items: params.items.map((item) => ({
        name: item.name || 'Apparel Item',
        sku: item.sku || 'SKU-GEN',
        units: Math.max(1, item.units || 1),
        selling_price: Math.max(1, item.selling_price || 1),
        discount: item.discount || 0,
        tax: item.tax || 0,
        hsn: 6203,
      })),
      payment_method: params.paymentMethod === 'COD' ? 'COD' : 'Prepaid',
      sub_total: Math.max(1, params.subtotal),
      length: Math.max(10, params.length || 15),
      breadth: Math.max(10, params.breadth || 15),
      height: Math.max(5, params.height || 10),
      weight: Math.max(0.2, params.weight || 0.5),
    };

    try {
      const res = await this.request({
        method: 'post',
        url: '/orders/create/adhoc',
        data: payload,
      });

      if (!res || (!res.order_id && !res.shipment_id)) {
        throw new Error(res?.message || 'Shiprocket order creation returned an invalid payload');
      }

      return {
        orderId: res.order_id,
        shipmentId: res.shipment_id,
        status: res.status || 'NEW',
        statusCode: res.status_code || 1,
      };
    } catch (err: any) {
      const details = err.response?.data?.message || err.response?.data?.errors || err.message;
      throw new Error(`Failed to create order in Shiprocket: ${typeof details === 'object' ? JSON.stringify(details) : details}`);
    }
  }

  /**
   * Generates AWB and Assigns a Courier to the Shipment.
   */
  public async assignAwb(shipmentId: number | string, courierId?: number): Promise<ShiprocketAwbResult> {
    try {
      const data: any = { shipment_id: Number(shipmentId) };
      if (courierId) data.courier_id = courierId;

      const res = await this.request({
        method: 'post',
        url: '/courier/assign/awb',
        data,
      });

      const responseObj = res?.response?.data || res?.data || res;
      const awbCode = responseObj?.awb_code;
      const courierName = responseObj?.courier_name || res?.courier_name || 'Shiprocket Express';
      const courierCompanyId = responseObj?.courier_company_id || res?.courier_company_id || 0;

      if (!awbCode) {
        throw new Error(res?.message || responseObj?.error || 'AWB code was not generated');
      }

      return {
        awbCode,
        courierName,
        courierCompanyId,
      };
    } catch (err: any) {
      const details = err.response?.data?.message || err.response?.data?.errors || err.message;
      throw new Error(`AWB Assignment Failed: ${typeof details === 'object' ? JSON.stringify(details) : details}`);
    }
  }

  /**
   * Requests Courier Pickup for the assigned shipment.
   */
  public async requestPickup(shipmentId: number | string): Promise<ShiprocketPickupResult> {
    try {
      const res = await this.request({
        method: 'post',
        url: '/courier/generate/pickup',
        data: {
          shipment_id: [Number(shipmentId)],
        },
      });

      const pickupData = res?.response || res?.data || res;
      return {
        pickupStatus: pickupData?.pickup_status || 1,
        pickupScheduledDate: pickupData?.pickup_scheduled_date || pickupData?.pickup_date || undefined,
        pickupTokenNumber: pickupData?.pickup_token_number || pickupData?.token_number || undefined,
      };
    } catch (err: any) {
      const details = err.response?.data?.message || err.message;
      throw new Error(`Pickup Request Failed: ${details}`);
    }
  }

  /**
   * Generates official Shipping Label URL.
   */
  public async generateLabel(shipmentId: number | string): Promise<string | null> {
    try {
      const res = await this.request({
        method: 'post',
        url: '/courier/generate/label',
        data: {
          shipment_id: [Number(shipmentId)],
        },
      });

      return res?.label_url || res?.response?.label_url || null;
    } catch (err) {
      return null;
    }
  }

  /**
   * Generates official Tax Invoice URL.
   */
  public async printInvoice(orderId: number | string): Promise<string | null> {
    try {
      const res = await this.request({
        method: 'post',
        url: '/orders/print/invoice',
        data: {
          ids: [Number(orderId)],
        },
      });

      return res?.invoice_url || null;
    } catch (err) {
      return null;
    }
  }

  /**
   * Fetches Real-time Tracking Info by AWB Code.
   */
  public async trackByAwb(awbCode: string): Promise<ShiprocketTrackingResult> {
    try {
      const cleanAwb = awbCode.trim();
      const res = await this.request({
        method: 'get',
        url: `/courier/track/awb/${cleanAwb}`,
      });

      const trackData = res?.tracking_data || res;
      const shipmentTrack = trackData?.shipment_track?.[0] || trackData?.shipment_track || {};
      const activities: any[] = trackData?.shipment_track_activities || trackData?.activities || [];

      const currentStatus = shipmentTrack?.current_status || shipmentTrack?.status || 'IN_TRANSIT';
      const courierName = shipmentTrack?.courier_name || shipmentTrack?.carrier_name || 'Carrier Partner';
      const edd = shipmentTrack?.edd || shipmentTrack?.expected_date || null;

      const scans: ShiprocketTrackingActivity[] = activities.map((act) => ({
        date: act.date || act.activity_date || new Date().toISOString(),
        status: act.status || act['sr-status-label'] || 'UPDATE',
        activity: act.activity || act.details || '',
        location: act.location || act.city || 'Courier Hub',
        srStatus: act['sr-status'] || '',
      }));

      return {
        trackingNumber: cleanAwb,
        currentStatus,
        courierName,
        estimatedDeliveryDate: edd,
        scans,
        rawResponse: trackData,
      };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      throw new Error(`Tracking lookup failed: ${msg}`);
    }
  }

  /**
   * Cancels an order in Shiprocket (before dispatch/pickup).
   */
  public async cancelOrder(shiprocketOrderId: number | string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await this.request({
        method: 'post',
        url: '/orders/cancel',
        data: {
          ids: [Number(shiprocketOrderId)],
        },
      });

      return {
        success: true,
        message: res?.message || 'Order cancelled in Shiprocket successfully',
      };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      throw new Error(`Shiprocket order cancellation failed: ${msg}`);
    }
  }

  /**
   * Creates a Return / Reverse Pickup Order in Shiprocket.
   */
  public async createReturnOrder(params: {
    orderNumber: string;
    orderDate?: Date;
    pickupLocationName?: string; // warehouse to return to
    customerAddress: {
      name: string;
      email?: string;
      phone: string;
      address: string;
      address2?: string;
      city: string;
      state: string;
      postalCode: string;
    };
    warehouseAddress?: {
      name?: string;
      phone?: string;
      address?: string;
      address2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
    };
    items: {
      name: string;
      sku: string;
      units: number;
      selling_price: number;
      reason?: string;
    }[];
    subtotal: number;
  }): Promise<{ returnOrderId: number; returnShipmentId: number; status: string; awbCode?: string | null; courierName?: string | null }> {
    const nameParts = (params.customerAddress.name || 'Customer').trim().split(/\s+/);
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || '.';

    const rawPhone = (params.customerAddress.phone || '').replace(/\D/g, '');
    const phone = rawPhone.length > 10 ? rawPhone.slice(-10) : (rawPhone || '9876543210');

    let addr = (params.customerAddress.address || '').trim();
    if (addr.length < 10) {
      addr = `${addr}, Doorstep Pickup, Pincode ${params.customerAddress.postalCode}`;
    }

    const wh = params.warehouseAddress || {};
    const destName = wh.name || 'YOX Warehouse Returns';
    const destAddress = wh.address || 'Room No. 44-958, Chovva Co-operative Bank Bldg';
    const destCity = wh.city || 'Kannur';
    const destState = wh.state || 'Kerala';
    const destPincode = wh.postalCode || '670006';
    const destPhone = wh.phone || '8891810649';

    const payload = {
      order_id: `RET-${params.orderNumber}-${Date.now().toString().slice(-4)}`,
      order_id_original: params.orderNumber,
      order_date: this.formatDateForShiprocket(params.orderDate || new Date()),
      channel_id: '',
      pickup_customer_name: firstName,
      pickup_last_name: lastName,
      pickup_address: addr,
      pickup_address_2: params.customerAddress.address2 || '',
      pickup_city: params.customerAddress.city,
      pickup_state: params.customerAddress.state,
      pickup_country: 'India',
      pickup_pincode: params.customerAddress.postalCode,
      pickup_email: params.customerAddress.email || 'customer@yox.com',
      pickup_phone: phone,
      shipping_is_billing: true,
      shipping_customer_name: destName,
      shipping_address: destAddress,
      shipping_address_2: wh.address2 || '',
      shipping_city: destCity,
      shipping_state: destState,
      shipping_country: 'India',
      shipping_pincode: destPincode,
      shipping_phone: destPhone,
      shipping_email: 'returns@yox.com',
      order_items: params.items.map((i) => ({
        name: i.name,
        sku: i.sku || 'SKU-RET',
        units: Math.max(1, i.units),
        selling_price: Math.max(1, i.selling_price),
        qc_enable: true,
        reason: i.reason || 'Customer Return',
      })),
      payment_method: 'Prepaid',
      sub_total: Math.max(1, params.subtotal),
      length: 15,
      breadth: 15,
      height: 10,
      weight: 0.5,
    };

    try {
      const res = await this.request({
        method: 'post',
        url: '/orders/create/return',
        data: payload,
      });

      const returnShipment = res?.response?.data || res?.data || res;
      return {
        returnOrderId: returnShipment?.order_id || res?.order_id,
        returnShipmentId: returnShipment?.shipment_id || res?.shipment_id,
        status: res?.status || 'RETURN_INITIATED',
        awbCode: returnShipment?.awb_code || res?.awb_code || null,
        courierName: returnShipment?.courier_name || res?.courier_name || null,
      };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      throw new Error(`Failed to create return order in Shiprocket: ${msg}`);
    }
  }

  /**
   * Orchestrates complete Shiprocket Reverse Return Workflow:
   * 1. Creates Reverse Return Order in Shiprocket (/orders/create/return)
   * 2. Attempts AWB Assignment (/courier/assign/awb)
   * 3. Attempts Doorstep Pickup Generation (/courier/generate/pickup)
   */
  public async createAndAssignReturnOrder(params: {
    orderNumber: string;
    orderDate?: Date;
    warehouseAddress?: {
      name?: string;
      phone?: string;
      address?: string;
      address2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
    };
    customerAddress: {
      name: string;
      email?: string;
      phone: string;
      address: string;
      address2?: string;
      city: string;
      state: string;
      postalCode: string;
    };
    items: {
      name: string;
      sku: string;
      units: number;
      selling_price: number;
      reason?: string;
    }[];
    subtotal: number;
  }): Promise<{
    returnOrderId: number;
    returnShipmentId: number;
    awbCode?: string | null;
    courierName?: string | null;
    pickupScheduledDate?: string | null;
    status: string;
    notice?: string;
  }> {
    // 1. Create return order in Shiprocket
    const retOrder = await this.createReturnOrder(params);
    let awbCode: string | null = retOrder.awbCode || null;
    let courierName: string | null = retOrder.courierName || null;
    let pickupScheduledDate: string | null = null;
    let notice: string | undefined = undefined;

    // 2. Try assigning reverse courier / AWB
    if (retOrder.returnShipmentId && !awbCode) {
      try {
        const awbRes = await this.assignAwb(retOrder.returnShipmentId);
        if (awbRes.awbCode) {
          awbCode = awbRes.awbCode;
          courierName = awbRes.courierName || 'Shiprocket Express';
        }
      } catch (awbErr: any) {
        notice = `Return order created (ID: #${retOrder.returnOrderId}). Courier assignment notice: ${awbErr.message}`;
      }
    }

    // 3. Try generating pickup if AWB was assigned
    if (retOrder.returnShipmentId && awbCode) {
      try {
        const pickupRes = await this.requestPickup(retOrder.returnShipmentId);
        pickupScheduledDate = pickupRes.pickupScheduledDate || null;
      } catch (pickupErr: any) {
        if (!notice) {
          notice = `AWB assigned (${awbCode}). Pickup request notice: ${pickupErr.message}`;
        }
      }
    }

    return {
      returnOrderId: retOrder.returnOrderId,
      returnShipmentId: retOrder.returnShipmentId,
      awbCode,
      courierName: courierName || 'Shiprocket Reverse Express',
      pickupScheduledDate,
      status: retOrder.status,
      notice,
    };
  }
}

