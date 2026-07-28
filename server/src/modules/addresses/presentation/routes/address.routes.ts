/**
 * @file address.routes.ts
 * @layer Presentation › Routes
 */

import { Router } from 'express';
import { AddressController } from '../controllers/address.controller';
import { AddressRepository } from '../../infrastructure/repositories/address.repository';
import { AddAddressUseCase } from '../../application/use-cases/add-address.use-case';
import { UpdateAddressUseCase } from '../../application/use-cases/update-address.use-case';
import { DeleteAddressUseCase } from '../../application/use-cases/delete-address.use-case';
import { GetUserAddressesUseCase } from '../../application/use-cases/get-user-addresses.use-case';
import { SetDefaultAddressUseCase } from '../../application/use-cases/set-default-address.use-case';
import { requireAuth } from '../../../../presentation/http/middleware/require-auth.middleware';

const addressRouter = Router();

// Dependency Injection setup (in a real app this might be done via a DI container)
const addressRepository = new AddressRepository();
const addAddressUseCase = new AddAddressUseCase(addressRepository);
const updateAddressUseCase = new UpdateAddressUseCase(addressRepository);
const deleteAddressUseCase = new DeleteAddressUseCase(addressRepository);
const getUserAddressesUseCase = new GetUserAddressesUseCase(addressRepository);
const setDefaultAddressUseCase = new SetDefaultAddressUseCase(addressRepository);

const addressController = new AddressController(
  addAddressUseCase,
  updateAddressUseCase,
  deleteAddressUseCase,
  getUserAddressesUseCase,
  setDefaultAddressUseCase
);

// All address routes require authentication
addressRouter.use(requireAuth);

addressRouter.get('/', addressController.getAddresses);
addressRouter.post('/', addressController.addAddress);
addressRouter.put('/:id', addressController.updateAddress);
addressRouter.delete('/:id', addressController.deleteAddress);
addressRouter.patch('/:id/default', addressController.setDefaultAddress);

export { addressRouter };
