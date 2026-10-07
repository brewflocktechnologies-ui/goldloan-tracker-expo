import fs from 'fs';
import path from 'path';
import vm from 'vm';

/**
 * Loads the Apps Script backend into a sandbox with stubbed Google services, so the guards that
 * run before any sheet access (GET can't mutate, required fields) are tested without Google.
 */
function loadBackend() {
  const appended: any[] = [];
  const sandbox: any = {
    console,
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ({
        getId: () => 'sheet-id',
      }),
      openById: () => ({
        getSheetByName: () => ({
          appendRow: (row: any[]) => appended.push(row),
          getLastColumn: () => 0,
          getLastRow: () => 0,
          getDataRange: () => ({ getValues: () => [[]] }),
          getRange: () => ({
            setValue() { return this; },
            setValues() { return this; },
            setFontWeight() { return this; },
            setBackground() { return this; },
            setFontColor() { return this; },
            getValues: () => [[]],
          }),
        }),
      }),
    },
    ContentService: {
      createTextOutput: (text: string) => ({ body: text, setMimeType() { return this; } }),
      MimeType: { JSON: 'json' },
    },
    HtmlService: { createHtmlOutputFromFile: () => ({ setTitle() { return this; }, addMetaTag() { return this; }, setXFrameOptionsMode() { return this; } }), XFrameOptionsMode: { ALLOWALL: 1 } },
    CacheService: { getScriptCache: () => ({ get: () => null, put() {}, remove() {} }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => null, setProperty() {} }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    Utilities: { computeDigest: () => [], base64Encode: () => '', DigestAlgorithm: { SHA_256: 1 }, getUuid: () => 'uuid' },
    DriveApp: {},
    UrlFetchApp: {},
  };
  const src = fs.readFileSync(path.join(__dirname, '../../backend/Code.gs'), 'utf8');
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox);
  const parse = (res: any) => JSON.parse(res.body);
  return { fn: sandbox, parse, appended };
}

describe('backend doGet — reads only', () => {
  it.each([
    'addBankAccount', 'addUser', 'addOrnament', 'addLoan', 'addPayment',
    'updateUser', 'updateBankAccount', 'updateLoan',
    'deleteUser', 'deleteBankAccount', 'deleteOrnament',
    'closeAndReleaseLoan',
  ])('rejects %s sent as a GET so a retry can never write a blank row', action => {
    const { fn, parse, appended } = loadBackend();
    const res = parse(fn.doGet({ parameter: { action, token: 't' } }));
    expect(res).toEqual({ success: false, error: 'This action requires POST' });
    expect(appended).toHaveLength(0);
  });

  it('still serves read actions', () => {
    const { fn, parse } = loadBackend();
    const res = parse(fn.doGet({ parameter: { action: 'ping' } }));
    expect(res.success).toBe(true);
    expect(res.data).toBe('PONG');
  });
});

describe('backend — required fields', () => {
  it('addBankAccount_ refuses an empty record instead of writing a blank row', () => {
    const { fn, appended } = loadBackend();
    expect(fn.addBankAccount_({})).toEqual({
      success: false,
      error: 'UserId, BankName and AccountNumber are required',
    });
    expect(fn.addBankAccount_(undefined).success).toBe(false);
    expect(appended).toHaveLength(0);
  });

  it.each([
    [{ BankName: 'SBI', AccountNumber: '1' }],
    [{ UserId: 'U1', AccountNumber: '1' }],
    [{ UserId: 'U1', BankName: 'SBI' }],
  ])('addBankAccount_ requires UserId, BankName and AccountNumber (%j)', data => {
    const { fn, appended } = loadBackend();
    expect(fn.addBankAccount_(data).success).toBe(false);
    expect(appended).toHaveLength(0);
  });

  it('addUser_ refuses a record without a name', () => {
    const { fn, appended } = loadBackend();
    expect(fn.addUser_({})).toEqual({ success: false, error: 'FullName is required' });
    expect(fn.addUser_(null).success).toBe(false);
    expect(appended).toHaveLength(0);
  });
});
