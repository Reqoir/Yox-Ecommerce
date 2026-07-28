/**
 * @file address.controller.ts
 * @layer Presentation › Controllers
 */

import { Request, Response, NextFunction } from 'express';
import { AddAddressUseCase } from '../../application/use-cases/add-address.use-case';
import { UpdateAddressUseCase } from '../../application/use-cases/update-address.use-case';
import { DeleteAddressUseCase } from '../../application/use-cases/delete-address.use-case';
import { GetUserAddressesUseCase } from '../../application/use-cases/get-user-addresses.use-case';
import { SetDefaultAddressUseCase } from '../../application/use-cases/set-default-address.use-case';
import { validateRequest } from '@shared/utils/validation.helper';
import { createAddressSchema, updateAddressSchema } from '../validators/address.validator';
import { ApiResponse } from '@shared/utils/api-response.util';
import { HttpStatus } from '@shared/constants/http-status.constants';

export class AddressController {
  constructor(
    private readonly addAddressUseCase: AddAddressUseCase,
    private readonly updateAddressUseCase: UpdateAddressUseCase,
    private readonly deleteAddressUseCase: DeleteAddressUseCase,
    private readonly getUserAddressesUseCase: GetUserAddressesUseCase,
    private readonly setDefaultAddressUseCase: SetDefaultAddressUseCase
  ) {}

  public addAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validBody = validateRequest(req, createAddressSchema, 'body');
      const userId = req.user!.id; // auth middleware ensures user is present

      const address = await this.addAddressUseCase.execute({ ...validBody, userId });

      ApiResponse.success(res, address, 'Address added successfully', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  };

  public getAddresses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const addresses = await this.getUserAddressesUseCase.execute(userId);

      ApiResponse.success(res, addresses, 'Addresses retrieved successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  public updateAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validBody = validateRequest(req, updateAddressSchema, 'body');
      const userId = req.user!.id;
      const { id } = req.params;

      const address = await this.updateAddressUseCase.execute(id, userId, validBody);

      ApiResponse.success(res, address, 'Address updated successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  public deleteAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      await this.deleteAddressUseCase.execute(id, userId);

      ApiResponse.success(res, null, 'Address deleted successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  public setDefaultAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const address = await this.setDefaultAddressUseCase.execute(id, userId);

      ApiResponse.success(res, address, 'Default address set successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };
}
