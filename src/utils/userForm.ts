import type { UserFormState } from '../components/users/UserFormView';

/** A blank customer form. No location/occupation is pre-filled so nothing wrong is saved by default. */
export function createEmptyUserForm(customerCode = ''): UserFormState {
  return {
    FullName: '',
    FatherHusbandName: '',
    CustomerCode: customerCode,
    MobileNumber: '',
    AlternateMobileNumber: '',
    Email: '',
    DateOfBirth: '',
    Gender: 'Male',
    Occupation: '',
    AadhaarNumber: '',
    PANNumber: '',
    AddressLine1: '',
    AddressLine2: '',
    City: '',
    State: '',
    Pincode: '',
    CustomerPhoto: '',
    Status: 'Active',
  };
}

export interface FormError {
  title: string;
  message: string;
}

const digits = (v: string) => v.replace(/[^\d]/g, '');

/** Returns the first validation problem in the customer form, or null when it is valid. */
export function validateUserForm(form: UserFormState): FormError | null {
  if (!form.FullName.trim()) {
    return { title: 'Required Field', message: 'Please enter Full Name.' };
  }
  const mobile = digits(form.MobileNumber);
  if (mobile.length !== 10) {
    return { title: 'Invalid Mobile Number', message: 'Please enter a valid 10-digit mobile number.' };
  }
  const alt = form.AlternateMobileNumber.trim();
  if (alt && digits(alt).length !== 10) {
    return { title: 'Invalid Alternate Number', message: 'Alternate mobile number must be 10 digits.' };
  }
  const email = form.Email.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { title: 'Invalid Email', message: 'Please enter a valid email address.' };
  }
  const aadhaar = form.AadhaarNumber.trim();
  if (aadhaar && digits(aadhaar).length !== 12) {
    return { title: 'Invalid Aadhaar', message: 'Aadhaar number must be 12 digits.' };
  }
  const pan = form.PANNumber.trim();
  if (pan && !/^[A-Z]{5}\d{4}[A-Z]$/.test(pan.toUpperCase())) {
    return { title: 'Invalid PAN', message: 'PAN must look like ABCDE1234F.' };
  }
  const pin = form.Pincode.trim();
  if (pin && !/^\d{6}$/.test(pin)) {
    return { title: 'Invalid Pincode', message: 'Pincode must be 6 digits.' };
  }
  return null;
}
