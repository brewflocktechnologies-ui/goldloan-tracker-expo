import { createEmptyUserForm, validateUserForm } from '../../src/utils/userForm';

const valid = () => ({ ...createEmptyUserForm('CUST-1'), FullName: 'Ravi Kumar', MobileNumber: '9876543210' });

describe('createEmptyUserForm', () => {
  it('pre-fills no location or occupation', () => {
    const f = createEmptyUserForm('CUST-9');
    expect(f).toMatchObject({ CustomerCode: 'CUST-9', City: '', State: '', Pincode: '', Occupation: '', Status: 'Active', Gender: 'Male' });
  });
});

describe('validateUserForm', () => {
  it('accepts a minimal valid form and a fully valid one', () => {
    expect(validateUserForm(valid())).toBeNull();
    expect(
      validateUserForm({
        ...valid(),
        AlternateMobileNumber: '98765 43211',
        Email: 'a@b.co',
        AadhaarNumber: '1234 1234 1234',
        PANNumber: 'abcde1234f',
        Pincode: '560001',
      })
    ).toBeNull();
  });

  it.each([
    [{ FullName: '  ' }, 'Required Field'],
    [{ MobileNumber: '12345' }, 'Invalid Mobile Number'],
    [{ MobileNumber: '98765432101' }, 'Invalid Mobile Number'],
    [{ AlternateMobileNumber: '123' }, 'Invalid Alternate Number'],
    [{ Email: 'not-an-email' }, 'Invalid Email'],
    [{ AadhaarNumber: '1234' }, 'Invalid Aadhaar'],
    [{ PANNumber: 'ABC123' }, 'Invalid PAN'],
    [{ Pincode: '5600' }, 'Invalid Pincode'],
  ])('rejects %j', (patch, title) => {
    expect(validateUserForm({ ...valid(), ...patch })?.title).toBe(title);
  });
});
