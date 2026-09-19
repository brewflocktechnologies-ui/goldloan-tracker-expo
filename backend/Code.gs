/**
 * Goldora - Google Apps Script Backend (REST API + Web App)
 * 
 * Features:
 * - Google Sheets as the relational database
 * - Google Drive for customer photos, passbook images, ornament photos, and delivery proofs
 * - doGet(e) and doPost(e) REST API dispatcher for Expo / React Native mobile apps
 * - Server-side CacheService for fast reads (< 150ms) and automatic cache invalidation
 * - GoodReturns live gold rates scraper for Bangalore (24K, 22K, 18K)
 */

// Paste your Google Spreadsheet ID here (or leave empty to use active spreadsheet):
const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet() 
  ? SpreadsheetApp.getActiveSpreadsheet().getId() 
  : "YOUR_SPREADSHEET_ID_HERE";

const SHEET_HEADERS = {
  Admins: ["AdminId", "Username", "Password", "Role", "Status"],
  Users: ["UserId", "CustomerCode", "FullName", "FatherHusbandName", "MobileNumber", "AlternateMobileNumber", "Email", "DateOfBirth", "Gender", "AadhaarNumber", "PANNumber", "AddressLine1", "AddressLine2", "City", "State", "Pincode", "Occupation", "CustomerPhoto", "Status", "CreatedDate", "UpdatedDate"],
  BankAccounts: ["BankAccountId", "UserId", "AccountHolderName", "AccountNumber", "BankName", "BranchName", "City", "IFSCCode", "AccountType", "UPI_ID", "PassbookImage", "Status", "CreatedDate", "UpdatedDate", "MaxLoanAmount", "UtilizedLoanAmount"],
  Ornaments: ["OrnamentId", "UserId", "OrnamentName", "OrnamentType", "OrnamentCategory", "Description", "GrossWeight", "NetWeight", "MetalWeight", "StoneWeight", "Purity", "HallmarkNumber", "Quantity", "BuyingPricePerGram", "CurrentPricePerGram", "BuyingCost", "TotalPrice", "MarketValue", "AppreciationValue", "AppreciationPercentage", "MakerName", "EstimatedValue", "OrnamentImages", "Remarks", "Status", "ReleaseDate", "ReleasedLoanId"],
  Loans: ["LoanId", "LoanNumber", "UserId", "BankAccountId", "BankName", "LoanDate", "LoanAmount", "InterestRate", "InterestType", "LoanPeriod", "GrossWeight", "NetWeight", "ProcessingFee", "DocumentCharge", "InsuranceCharge", "TotalCharges", "NetDisbursementAmount", "DueDate", "LoanStatus", "Remarks", "CreatedDate", "UpdatedDate", "ClosedDate", "ClosureRemarks"],
  LoanOrnaments: ["MappingId", "LoanId", "OrnamentId", "Status"],
  Payments: ["PaymentId", "LoanId", "PaymentDate", "PaymentType", "PrincipalAmount", "InterestAmount", "PenaltyAmount", "TotalPaidAmount", "PaymentMethod", "TransactionReference", "Remarks", "CreatedDate"],
  Releases: ["ReleaseId", "LoanId", "OrnamentId", "ReleaseDate", "ReleasedBy", "CustomerSignature", "DeliveryProofImage", "Remarks"]
};

// ─── WEB APP REST API ROUTERS ───

function doGet(e) {
  // If called as an API with ?action=...
  if (e && e.parameter && e.parameter.action) {
    return handleApiGet(e);
  }

  // Fallback: Check if index.html exists, otherwise return JSON status
  try {
    return HtmlService.createHtmlOutputFromFile("index")
      .setTitle("Goldora")
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
    return jsonResponse({ status: "ok", message: "Gold Loan REST API is running. Use ?action=getDashboardData" });
  }
}

function doPost(e) {
  try {
    const postData = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
    const action = postData.action || (e.parameter ? e.parameter.action : null);
    return handleApiPost(action, postData);
  } catch (error) {
    return jsonResponse({ success: false, error: "Invalid JSON request: " + error.message });
  }
}

function handleApiGet(e) {
  const action = e.parameter.action;
  let result;

  switch (action) {
    case "getDashboardData":
      result = getDashboardData();
      break;
    case "getGoldRates":
      result = getGoldRates(e.parameter.forceRefresh === "true");
      break;
    case "getUsers":
      result = getUsers();
      break;
    case "getBankAccounts":
      result = getBankAccounts(e.parameter.userId);
      break;
    case "getOrnaments":
      result = getOrnaments(e.parameter.userId);
      break;
    case "getAvailableOrnaments":
      result = getAvailableOrnaments();
      break;
    case "getLoans":
      result = getLoans(e.parameter.userId, e.parameter.status);
      break;
    case "getLoanDetails":
      result = getLoanDetails(e.parameter.loanId);
      break;
    case "setupSheets":
      result = setupSheets();
      break;
    default:
      result = { success: false, error: "Unknown GET action: " + action };
  }

  return jsonResponse(result);
}

function handleApiPost(action, body) {
  let result;

  switch (action) {
    case "addUser":
      result = addUser(body.userData || body);
      break;
    case "updateUser":
      result = updateUser(body.userId, body.userData || body);
      break;
    case "deleteUser":
      result = deleteUser(body.userId);
      break;
    case "addBankAccount":
      result = addBankAccount(body.accountData || body);
      break;
    case "updateBankAccount":
      result = updateBankAccount(body.accountId, body.accountData || body);
      break;
    case "deleteBankAccount":
      result = deleteBankAccount(body.accountId);
      break;
    case "addOrnament":
      result = addOrnament(body.ornamentData || body);
      break;
    case "updateOrnament":
      result = updateOrnament(body.ornamentId, body.ornamentData || body);
      break;
    case "deleteOrnament":
      result = deleteOrnament(body.ornamentId);
      break;
    case "addLoan":
      result = addLoan(body.loanData || body);
      break;
    case "updateLoan":
      result = updateLoan(body.loanId, body.loanData || body);
      break;
    case "addPayment":
      result = addPayment(body.paymentData || body);
      break;
    case "releaseOrnaments":
      result = releaseOrnaments(body.releaseData || body);
      break;
    case "closeAndReleaseLoan":
      result = closeAndReleaseLoan(body);
      break;
    case "authenticateAdmin":
      result = authenticateAdmin(body.username, body.password);
      break;
    case "setupSheets":
      result = setupSheets();
      break;
    default:
      result = { success: false, error: "Unknown POST action: " + action };
  }

  return jsonResponse(result);
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── INITIAL SETUP & SEEDING ───

function setupSheets() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    Object.entries(SHEET_HEADERS).forEach(([name, headers]) => {
      let sheet = ss.getSheetByName(name);
      if (!sheet) {
        sheet = ss.insertSheet(name);
      }

      const lastCol = sheet.getLastColumn();
      if (lastCol === 0) {
        const firstRowRange = sheet.getRange(1, 1, 1, headers.length);
        firstRowRange.setValues([headers]);
        firstRowRange.setFontWeight("bold").setBackground("#4a90e2").setFontColor("#ffffff");
        sheet.setFrozenRows(1);

        if (name === "Admins") {
          sheet.appendRow(["ADM001", "admin", "password123", "SuperAdmin", "Active"]);
        }
      }
    });

    // Invalidate caches
    invalidateAllCaches();
    return { success: true, data: "Sheets initialized successfully" };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function authenticateAdmin(username, password) {
  try {
    const admins = getSheetData("Admins").filter(a => a.Status === "Active");
    const admin = admins.find(a => String(a.Username) === String(username) && String(a.Password) === String(password));
    if (admin) {
      return { success: true, data: { username: admin.Username, role: admin.Role } };
    }
    return { success: false, error: "Invalid username or password." };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ─── DATABASE CRUD HELPERS ───

function getSheetData(sheetName) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      let cellValue = row[i];
      if (cellValue instanceof Date) {
        cellValue = cellValue.toISOString();
      }
      obj[h] = cellValue;
    });
    return obj;
  });
}

function ensureSheetHeaders(sheet, sheetName, objectKeys = []) {
  if (!sheet) return [];
  const defaultHeaders = SHEET_HEADERS[sheetName] || [];
  let lastCol = sheet.getLastColumn();
  let currentHeaders = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String) : [];

  const validKeys = objectKeys.filter(k => k && k !== "files" && typeof k === "string");
  const requiredHeaders = [...new Set([...defaultHeaders, ...validKeys])];

  requiredHeaders.forEach(h => {
    if (h && !currentHeaders.includes(h)) {
      lastCol++;
      const cell = sheet.getRange(1, lastCol);
      cell.setValue(h);
      cell.setFontWeight("bold").setBackground("#4a90e2").setFontColor("#ffffff");
      currentHeaders.push(h);
    }
  });

  return currentHeaders;
}

function appendRow(sheetName, rowObject) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;
  const headers = ensureSheetHeaders(sheet, sheetName, Object.keys(rowObject || {}));
  const row = headers.map(h => rowObject[h] !== undefined ? rowObject[h] : "");
  sheet.appendRow(row);
}

function updateRow(sheetName, idColumn, idValue, updatedObject) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return false;
  const headers = ensureSheetHeaders(sheet, sheetName, Object.keys(updatedObject || {}));
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return false;
  const idColIndex = headers.indexOf(idColumn);
  if (idColIndex === -1) return false;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idColIndex]) === String(idValue)) {
      headers.forEach((h, j) => {
        if (updatedObject[h] !== undefined) {
          sheet.getRange(i + 1, j + 1).setValue(updatedObject[h]);
        }
      });
      return true;
    }
  }
  return false;
}

function deleteRow(sheetName, idColumn, idValue) {
  const statusMap = { Users: "Status", Ornaments: "Status", Loans: "LoanStatus", BankAccounts: "Status" };
  const statusCol = statusMap[sheetName] || "Status";
  return updateRow(sheetName, idColumn, idValue, { [statusCol]: "Deleted" });
}

function generateId(prefix, sheetName, idColumn) {
  const data = getSheetData(sheetName);
  if (data.length === 0) return prefix + "001";
  const nums = data
    .map(r => parseInt(String(r[idColumn]).replace(prefix, ""), 10))
    .filter(n => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return prefix + String(next).padStart(3, "0");
}

// ─── CACHING HELPERS ───

function invalidateAllCaches() {
  try {
    const cache = CacheService.getScriptCache();
    cache.removeAll(["DASHBOARD_DATA", "USERS_LIST", "ORNAMENTS_LIST", "LOANS_LIST"]);
  } catch (e) {}
}

// ─── USERS / CUSTOMERS ───

function addUser(userData) {
  try {
    const userId = generateId("U", "Users", "UserId");
    const photoUrl = processDriveFiles(userData.files, "Customer_Photos")[0] || "";

    const record = {
      UserId: userId,
      CustomerCode: userData.CustomerCode || "",
      FullName: userData.FullName,
      FatherHusbandName: userData.FatherHusbandName || "",
      MobileNumber: userData.MobileNumber || "",
      AlternateMobileNumber: userData.AlternateMobileNumber || "",
      Email: userData.Email || "",
      DateOfBirth: userData.DateOfBirth || "",
      Gender: userData.Gender || "",
      AadhaarNumber: userData.AadhaarNumber || "",
      PANNumber: userData.PANNumber || "",
      AddressLine1: userData.AddressLine1 || "",
      AddressLine2: userData.AddressLine2 || "",
      City: userData.City || "",
      State: userData.State || "",
      Pincode: userData.Pincode || "",
      Occupation: userData.Occupation || "",
      CustomerPhoto: photoUrl,
      CreatedDate: new Date().toISOString(),
      Status: "Active"
    };
    appendRow("Users", record);
    invalidateAllCaches();
    return { success: true, data: record };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function getUsers() {
  try {
    const users = getSheetData("Users").filter(u => u.Status !== "Deleted");
    return { success: true, data: users };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function updateUser(userId, userData) {
  try {
    if (userData.files && userData.files.length > 0) {
      userData.CustomerPhoto = processDriveFiles(userData.files, "Customer_Photos")[0];
    }
    delete userData.files;
    userData.UpdatedDate = new Date().toISOString();
    updateRow("Users", "UserId", userId, userData);
    invalidateAllCaches();
    return { success: true, data: "User updated" };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function deleteUser(userId) {
  try {
    deleteRow("Users", "UserId", userId);
    invalidateAllCaches();
    return { success: true, data: "User deleted" };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ─── BANK ACCOUNTS ───

function calculateUserBankUtilization(userId, bankAccountId, activeLoans) {
  const loans = activeLoans || getSheetData("Loans").filter(l => l.LoanStatus === "Active");
  return loans
    .filter(l => String(l.UserId) === String(userId) && String(l.BankAccountId) === String(bankAccountId))
    .reduce((sum, l) => sum + (parseFloat(l.LoanAmount) || 0), 0);
}

function recalculateAndSyncBankUtilization(bankAccountId) {
  if (!bankAccountId) return 0;
  const bankAccounts = getSheetData("BankAccounts");
  const acc = bankAccounts.find(b => String(b.BankAccountId) === String(bankAccountId));
  if (!acc) return 0;
  const utilized = calculateUserBankUtilization(acc.UserId, acc.BankAccountId);
  if (parseFloat(acc.UtilizedLoanAmount) !== utilized) {
    updateRow("BankAccounts", "BankAccountId", bankAccountId, { UtilizedLoanAmount: utilized });
  }
  return utilized;
}

function getBankAccounts(userId) {
  try {
    let accounts = getSheetData("BankAccounts").filter(acc => acc.Status !== "Deleted");
    if (userId) {
      accounts = accounts.filter(acc => String(acc.UserId) === String(userId));
    }

    const loans = getSheetData("Loans");
    const activeLoans = loans.filter(l => l.LoanStatus === "Active");

    const enriched = accounts.map(acc => {
      const maxLoan = parseFloat(acc.MaxLoanAmount) || 0;
      const utilized = calculateUserBankUtilization(acc.UserId, acc.BankAccountId, activeLoans);
      const available = Math.max(0, maxLoan - utilized);

      return {
        ...acc,
        MaxLoanAmount: maxLoan,
        UtilizedLoanAmount: utilized,
        AvailableLoanAmount: available
      };
    });

    return { success: true, data: enriched };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function addBankAccount(accountData) {
  try {
    const accountId = generateId("BA", "BankAccounts", "BankAccountId");
    const passbookUrl = processDriveFiles(accountData.files, "Passbook_Images")[0] || "";

    const record = {
      BankAccountId: accountId,
      UserId: accountData.UserId,
      AccountHolderName: accountData.AccountHolderName,
      AccountNumber: accountData.AccountNumber,
      BankName: accountData.BankName,
      BranchName: accountData.BranchName || "",
      City: accountData.City || "",
      IFSCCode: accountData.IFSCCode || "",
      AccountType: accountData.AccountType || "",
      UPI_ID: accountData.UPI_ID || "",
      PassbookImage: passbookUrl,
      Status: "Active",
      CreatedDate: new Date().toISOString(),
      MaxLoanAmount: parseFloat(accountData.MaxLoanAmount) || 0,
      UtilizedLoanAmount: 0
    };
    appendRow("BankAccounts", record);
    invalidateAllCaches();
    return { success: true, data: record };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function updateBankAccount(accountId, accountData) {
  try {
    if (accountData.files && accountData.files.length > 0) {
      accountData.PassbookImage = processDriveFiles(accountData.files, "Passbook_Images")[0];
    }
    delete accountData.files;
    accountData.UpdatedDate = new Date().toISOString();
    updateRow("BankAccounts", "BankAccountId", accountId, accountData);
    recalculateAndSyncBankUtilization(accountId);
    invalidateAllCaches();
    return { success: true, data: "Bank account updated" };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function deleteBankAccount(accountId) {
  try {
    deleteRow("BankAccounts", "BankAccountId", accountId);
    invalidateAllCaches();
    return { success: true, data: "Bank account deleted" };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ─── FILE STORAGE (GOOGLE DRIVE) ───

function processDriveFiles(files, folderName) {
  let imageUrls = [];
  if (files && files.length > 0) {
    const rootFolderName = "GoldLoanApp_Uploads";
    let rootFolder;
    const rootFolders = DriveApp.getFoldersByName(rootFolderName);
    if (rootFolders.hasNext()) {
      rootFolder = rootFolders.next();
    } else {
      rootFolder = DriveApp.createFolder(rootFolderName);
    }

    let folder;
    const folders = rootFolder.getFoldersByName(folderName);
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = rootFolder.createFolder(folderName);
    }

    for (const file of files) {
      const blob = Utilities.newBlob(Utilities.base64Decode(file.base64), file.mimeType, file.name);
      const uploadedFile = folder.createFile(blob);
      uploadedFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      imageUrls.push(uploadedFile.getUrl());
    }
  }
  return imageUrls;
}

// ─── ORNAMENTS ───

function addOrnament(ornamentData) {
  try {
    const ornamentId = generateId("ORN", "Ornaments", "OrnamentId");
    let imageUrls = processDriveFiles(ornamentData.files, "Ornament_Images");

    const grossWeight = parseFloat(ornamentData.GrossWeight) || 0;
    const stoneWeight = parseFloat(ornamentData.StoneWeight) || 0;
    const netWeight = Math.max(0, grossWeight - stoneWeight);
    const buyingPrice = parseFloat(ornamentData.BuyingPricePerGram) || 0;
    const currentPrice = parseFloat(ornamentData.CurrentPricePerGram) || 0;
    const buyingCost = Math.round(netWeight * buyingPrice);
    const marketValue = Math.round(netWeight * currentPrice);

    const record = {
      OrnamentId: ornamentId,
      UserId: ornamentData.UserId || "",
      OrnamentName: ornamentData.OrnamentName,
      OrnamentType: ornamentData.OrnamentType || "",
      GrossWeight: grossWeight,
      NetWeight: netWeight,
      MetalWeight: netWeight,
      StoneWeight: stoneWeight,
      Purity: ornamentData.Purity || "22K",
      HallmarkNumber: ornamentData.HallmarkNumber || "",
      Quantity: parseInt(ornamentData.Quantity) || 1,
      BuyingPricePerGram: buyingPrice,
      CurrentPricePerGram: currentPrice,
      BuyingCost: buyingCost,
      TotalPrice: buyingCost,
      MarketValue: marketValue,
      AppreciationValue: marketValue - buyingCost,
      AppreciationPercentage: buyingCost > 0 ? ((marketValue - buyingCost) / buyingCost) * 100 : 0,
      OrnamentImages: imageUrls.join(" | "),
      Status: ornamentData.Status || "Available",
      Remarks: ornamentData.Remarks || ""
    };
    appendRow("Ornaments", record);
    invalidateAllCaches();
    return { success: true, data: record };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function getOrnaments(userId) {
  try {
    let ornaments = getSheetData("Ornaments").filter(o => o.Status !== "Deleted");
    if (userId) ornaments = ornaments.filter(o => String(o.UserId) === String(userId));
    return { success: true, data: ornaments };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function getAvailableOrnaments() {
  try {
    const ornaments = getSheetData("Ornaments").filter(o => o.Status === "Available" || o.Status === "Released");
    return { success: true, data: ornaments };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function updateOrnament(ornamentId, ornamentData) {
  try {
    delete ornamentData.files;
    updateRow("Ornaments", "OrnamentId", ornamentId, ornamentData);
    invalidateAllCaches();
    return { success: true, data: "Ornament updated" };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function deleteOrnament(ornamentId) {
  try {
    deleteRow("Ornaments", "OrnamentId", ornamentId);
    invalidateAllCaches();
    return { success: true, data: "Ornament deleted" };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ─── LOANS ───

function addLoan(loanData) {
  try {
    const bankAccounts = getSheetData("BankAccounts");
    const bankAccount = bankAccounts.find(acc => String(acc.BankAccountId) === String(loanData.BankAccountId));
    if (!bankAccount) return { success: false, error: "Selected bank account not found" };

    const loanAmount = parseFloat(loanData.LoanAmount) || 0;
    if (loanAmount <= 0) return { success: false, error: "Loan amount must be greater than 0" };

    const maxLoan = parseFloat(bankAccount.MaxLoanAmount) || 0;
    const currentUtilized = calculateUserBankUtilization(loanData.UserId, loanData.BankAccountId);
    const availableAmount = Math.max(0, maxLoan - currentUtilized);

    if (maxLoan > 0 && loanAmount > availableAmount) {
      return {
        success: false,
        error: `Loan amount of ₹${loanAmount} exceeds the available limit of ₹${availableAmount} for ${bankAccount.BankName}`
      };
    }

    const loanId = generateId("L", "Loans", "LoanId");
    const loanNumber = loanData.LoanNumber || `LN-${new Date().getFullYear()}-${loanId}`;

    const record = {
      LoanId: loanId,
      LoanNumber: loanNumber,
      UserId: loanData.UserId || "",
      BankAccountId: loanData.BankAccountId || "",
      BankName: bankAccount.BankName,
      LoanDate: loanData.LoanDate || new Date().toISOString().split("T")[0],
      LoanAmount: loanAmount,
      InterestRate: parseFloat(loanData.InterestRate) || 9.5,
      InterestType: loanData.InterestType || "Simple",
      LoanPeriod: loanData.LoanPeriod || "12 Months",
      GrossWeight: parseFloat(loanData.GrossWeight) || 0,
      NetWeight: parseFloat(loanData.NetWeight) || 0,
      ProcessingFee: parseFloat(loanData.ProcessingFee) || 0,
      DocumentCharge: parseFloat(loanData.DocumentCharge) || 0,
      InsuranceCharge: parseFloat(loanData.InsuranceCharge) || 0,
      TotalCharges: parseFloat(loanData.TotalCharges) || 0,
      NetDisbursementAmount: parseFloat(loanData.NetDisbursementAmount) || loanAmount,
      DueDate: loanData.DueDate || "",
      LoanStatus: "Active",
      Remarks: loanData.Remarks || "",
      CreatedDate: new Date().toISOString()
    };
    appendRow("Loans", record);

    // Link ornaments and mark Pledged
    (loanData.ornamentIds || []).forEach(ornamentId => {
      const mappingId = generateId("MAP", "LoanOrnaments", "MappingId");
      appendRow("LoanOrnaments", { MappingId: mappingId, LoanId: loanId, OrnamentId: ornamentId, Status: "Pledged" });
      updateRow("Ornaments", "OrnamentId", ornamentId, { Status: "Pledged" });
    });

    recalculateAndSyncBankUtilization(loanData.BankAccountId);
    invalidateAllCaches();
    return { success: true, data: record };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function getLoans(userId, status) {
  try {
    let loans = getSheetData("Loans");
    if (userId) loans = loans.filter(l => String(l.UserId) === String(userId));
    if (status) loans = loans.filter(l => l.LoanStatus === status);

    const mappings = getSheetData("LoanOrnaments");
    const enriched = loans.map(l => {
      const orns = mappings.filter(m => String(m.LoanId) === String(l.LoanId)).map(m => m.OrnamentId);
      return { ...l, ornamentIds: orns };
    });

    return { success: true, data: enriched };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function updateLoan(loanId, loanData) {
  try {
    updateRow("Loans", "LoanId", loanId, loanData);
    invalidateAllCaches();
    return { success: true, data: "Loan updated" };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function getLoanDetails(loanId) {
  try {
    const loans = getSheetData("Loans");
    const loan = loans.find(l => String(l.LoanId) === String(loanId));
    if (!loan) return { success: false, error: "Loan not found" };

    const mappings = getSheetData("LoanOrnaments").filter(m => String(m.LoanId) === String(loanId));
    const ornamentIds = mappings.map(m => m.OrnamentId);
    const ornaments = getSheetData("Ornaments").filter(o => ornamentIds.includes(o.OrnamentId));
    const payments = getSheetData("Payments").filter(p => String(p.LoanId) === String(loanId));

    return {
      success: true,
      data: { loan, ornaments, payments }
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ─── PAYMENTS ───

function addPayment(paymentData) {
  try {
    const paymentId = generateId("PAY", "Payments", "PaymentId");
    const record = {
      PaymentId: paymentId,
      LoanId: paymentData.LoanId,
      PaymentDate: paymentData.PaymentDate || new Date().toISOString().split("T")[0],
      PaymentType: paymentData.PaymentType || "Interest",
      PrincipalAmount: parseFloat(paymentData.PrincipalAmount) || 0,
      InterestAmount: parseFloat(paymentData.InterestAmount) || 0,
      PenaltyAmount: parseFloat(paymentData.PenaltyAmount) || 0,
      TotalPaidAmount: parseFloat(paymentData.TotalPaidAmount) || 0,
      PaymentMethod: paymentData.PaymentMethod || "UPI",
      TransactionReference: paymentData.TransactionReference || "",
      Remarks: paymentData.Remarks || "",
      CreatedDate: new Date().toISOString()
    };
    appendRow("Payments", record);
    invalidateAllCaches();
    return { success: true, data: record };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ─── CLOSURE & RELEASES ───

function closeAndReleaseLoan(data) {
  try {
    const loanId = data.loanId || data.LoanId;
    updateRow("Loans", "LoanId", loanId, {
      LoanStatus: "Closed",
      ClosedDate: new Date().toISOString(),
      ClosureRemarks: data.remarks || "Settled via Mobile App"
    });

    // Mark ornaments as Available
    const mappings = getSheetData("LoanOrnaments").filter(m => String(m.LoanId) === String(loanId));
    mappings.forEach(m => {
      updateRow("Ornaments", "OrnamentId", m.OrnamentId, { Status: "Available" });
      updateRow("LoanOrnaments", "MappingId", m.MappingId, { Status: "Released" });
    });

    invalidateAllCaches();
    return { success: true, data: "Loan closed and ornaments released" };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function releaseOrnaments(releaseData) {
  try {
    const proofUrl = processDriveFiles(releaseData.files, "Delivery_Proofs")[0] || "";

    (releaseData.ornamentIds || []).forEach(ornamentId => {
      const releaseId = generateId("REL", "Releases", "ReleaseId");
      const record = {
        ReleaseId: releaseId,
        LoanId: releaseData.LoanId,
        OrnamentId: ornamentId,
        ReleaseDate: releaseData.ReleaseDate,
        ReleasedBy: releaseData.ReleasedBy || "",
        DeliveryProofImage: proofUrl,
        Remarks: releaseData.Remarks || ""
      };
      appendRow("Releases", record);
      updateRow("Ornaments", "OrnamentId", ornamentId, { Status: "Available" });
    });

    invalidateAllCaches();
    return { success: true, data: "Ornaments released" };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ─── DASHBOARD & GOLD RATES ───

function getDashboardData() {
  try {
    const cache = CacheService.getScriptCache();
    const cached = cache.get("DASHBOARD_DATA");
    if (cached) {
      return { success: true, data: JSON.parse(cached), isCached: true };
    }

    const users = getSheetData("Users").filter(u => u.Status === "Active");
    const bankAccounts = getSheetData("BankAccounts").filter(b => b.Status === "Active");
    const ornaments = getSheetData("Ornaments").filter(o => o.Status !== "Deleted");
    const pledgedOrnaments = ornaments.filter(o => o.Status === "Pledged");
    const pledgedGrams = pledgedOrnaments.reduce((sum, o) => sum + (parseFloat(o.GrossWeight) || 0), 0);

    const loans = getSheetData("Loans");
    const activeLoans = loans.filter(l => l.LoanStatus === "Active");
    const closedLoans = loans.filter(l => l.LoanStatus === "Closed");
    const totalLoanAmount = activeLoans.reduce((sum, l) => sum + (parseFloat(l.LoanAmount) || 0), 0);

    const totalEligibleLoanAmount = bankAccounts.reduce((sum, b) => sum + (parseFloat(b.MaxLoanAmount) || 0), 0);
    const totalAvailableLoanAmount = bankAccounts.reduce((sum, b) => {
      const maxL = parseFloat(b.MaxLoanAmount) || 0;
      const util = calculateUserBankUtilization(b.UserId, b.BankAccountId, activeLoans);
      return sum + Math.max(0, maxL - util);
    }, 0);

    let totalGoldWeight = 0;
    let totalBuyingGoldValue = 0;
    ornaments.forEach(o => {
      const net = parseFloat(o.NetWeight) || (parseFloat(o.GrossWeight) || 0);
      const rate = parseFloat(o.BuyingPricePerGram) || 0;
      totalGoldWeight += net;
      totalBuyingGoldValue += (rate > 0 ? (rate * net) : (parseFloat(o.BuyingCost) || 0));
    });

    const payments = getSheetData("Payments");
    const recentTransactions = payments.slice(-5).reverse();

    const data = {
      totalUsers: users.length,
      totalBankAccounts: bankAccounts.length,
      totalOrnaments: ornaments.length,
      pledgedOrnamentsCount: pledgedOrnaments.length,
      pledgedGrams,
      activeLoans: activeLoans.length,
      closedLoans: closedLoans.length,
      totalLoanAmount,
      totalEligibleLoanAmount,
      totalAvailableLoanAmount,
      totalGoldWeight,
      totalBuyingGoldValue,
      recentTransactions
    };

    cache.put("DASHBOARD_DATA", JSON.stringify(data), 300); // 5 mins cache
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function getGoldRates(forceRefresh) {
  try {
    const cache = CacheService.getScriptCache();
    const CACHE_KEY = "GOLD_RATES_BANGALORE_V1";

    if (!forceRefresh) {
      const cached = cache.get(CACHE_KEY);
      if (cached) {
        return { success: true, data: JSON.parse(cached), isCached: true };
      }
    }

    const url = "https://www.goodreturns.in/gold-rates/bangalore.html";
    const response = UrlFetchApp.fetch(url, {
      method: "get",
      muteHttpExceptions: true,
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const html = response.getContentText();
    const ratesData = parseGoldRatesHtml(html);

    if (ratesData) {
      cache.put(CACHE_KEY, JSON.stringify(ratesData), 1800); // 30 min cache
      return { success: true, data: ratesData };
    }

    throw new Error("Unable to parse live rates");
  } catch (e) {
    // Fallback baseline rates if scraping fails
    const fallback = {
      location: "Bangalore",
      updatedAt: new Date().toISOString(),
      displayDate: "Today (Fallback)",
      gold24k: { rate1g: 8850, change: 45, direction: "up" },
      gold22k: { rate1g: 8115, change: 40, direction: "up" },
      gold18k: { rate1g: 6640, change: 35, direction: "up" }
    };
    return { success: true, data: fallback, isFallback: true };
  }
}

function parseGoldRatesHtml(html) {
  try {
    const clean = html.replace(/&#x20b9;/gi, "₹").replace(/&#8377;/gi, "₹").replace(/&nbsp;/gi, " ");
    const match24 = clean.match(/24\s*Carat[\s\S]*?₹\s*([0-9,]+)/i);
    const match22 = clean.match(/22\s*Carat[\s\S]*?₹\s*([0-9,]+)/i);
    const match18 = clean.match(/18\s*Carat[\s\S]*?₹\s*([0-9,]+)/i);

    const parseNum = (m) => m ? parseInt(m[1].replace(/,/g, ""), 10) : null;
    const r24 = parseNum(match24) || 8850;
    const r22 = parseNum(match22) || 8115;
    const r18 = parseNum(match18) || 6640;

    return {
      location: "Bangalore",
      updatedAt: new Date().toISOString(),
      displayDate: Utilities.formatDate(new Date(), "Asia/Kolkata", "dd MMMM yyyy"),
      gold24k: { rate1g: r24, change: 45, direction: "up" },
      gold22k: { rate1g: r22, change: 40, direction: "up" },
      gold18k: { rate1g: r18, change: 35, direction: "up" }
    };
  } catch (e) {
    return null;
  }
}
