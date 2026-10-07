import { User } from '../../types';
import { generateCustomerCode } from '../../utils/userOrnamentCalculations';
import { api } from '../api';
import { normalizeUser } from '../normalize';
import { nextId, replaceItem, restoreItem, runMutation, SaveCallbacks } from './mutation';
import { persistAll } from './persist';
import { notify, state } from './state';

export function createUserActions() {
  const addUser = (userData: Partial<User> & { files?: any[] }, callbacks?: SaveCallbacks) => {
    const tempId = nextId('U', state.users, 'UserId');
    const newUser: User = {
      UserId: tempId,
      CustomerCode: userData.CustomerCode || generateCustomerCode(state.users.length),
      FullName: userData.FullName || 'New Customer',
      FatherHusbandName: userData.FatherHusbandName || '',
      MobileNumber: userData.MobileNumber || '',
      AlternateMobileNumber: userData.AlternateMobileNumber || '',
      Email: userData.Email || '',
      DateOfBirth: userData.DateOfBirth || '',
      Gender: userData.Gender || 'Male',
      AadhaarNumber: userData.AadhaarNumber || '',
      PANNumber: userData.PANNumber || '',
      AddressLine1: userData.AddressLine1 || '',
      AddressLine2: userData.AddressLine2 || '',
      City: userData.City || 'Bengaluru',
      State: userData.State || 'Karnataka',
      Pincode: userData.Pincode || '560001',
      Occupation: userData.Occupation || '',
      CustomerPhoto: userData.CustomerPhoto || '',
      Status: (userData.Status as any) || 'Active',
      CreatedDate: new Date().toISOString(),
    };
    const prevIds = new Set(state.users.map(u => u.UserId));
    state.users = [newUser, ...state.users];
    persistAll();
    notify();

    runMutation<User>(() => api.addUser(userData), {
      callbacks,
      failureMessage: `Customer "${newUser.FullName}" was not saved`,
      onSaved: data => {
        state.users = state.users.map(u => u.UserId === tempId ? { ...u, ...normalizeUser(data) } : u);
        persistAll();
        notify();
      },
      undo: () => { state.users = state.users.filter(u => u.UserId !== tempId); },
      alwaysUndo: true,
      findSaved: () => state.users.find(u => !prevIds.has(u.UserId) && u.FullName === newUser.FullName),
    });

    return newUser;
  };

  const updateUser = (userId: string, updated: Partial<User> & { files?: any[] }, callbacks?: SaveCallbacks) => {
    const prev = state.users.find(u => u.UserId === userId);
    state.users = state.users.map(u => u.UserId === userId ? { ...u, ...updated, UpdatedDate: new Date().toISOString() } : u);
    persistAll();
    notify();

    runMutation(() => api.updateUser(userId, updated), {
      callbacks,
      failureMessage: `Changes to ${prev?.FullName || userId} were not saved`,
      undo: () => { state.users = replaceItem(state.users, prev, 'UserId'); },
    });
  };

  const deleteUser = (userId: string, callbacks?: SaveCallbacks) => {
    const index = state.users.findIndex(u => u.UserId === userId);
    const prev = state.users[index];
    state.users = state.users.filter(u => u.UserId !== userId);
    persistAll();
    notify();

    runMutation(() => api.deleteUser(userId), {
      callbacks,
      failureMessage: `${prev?.FullName || userId} was not deleted`,
      undo: () => { state.users = restoreItem(state.users, prev, 'UserId', index); },
    });
  };

  return { addUser, updateUser, deleteUser };
}
