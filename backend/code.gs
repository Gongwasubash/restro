
/**
 * GOOGLE APPS SCRIPT BACKEND FOR SUBASH ROYAL
 * 
 * IMPORTANT: 
 * 1. ONLY paste this code into the Google Apps Script editor (Code.gs).
 * 2. Delete ALL other files in the Google Script editor to avoid "Import" errors.
 * 3. Run the 'getTableData' function once manually in the editor to authorize.
 */

const SHEETS = {
  PRODUCTS: 'Products',
  CATEGORIES: 'Categories',
  CUSTOMERS: 'Customers',
  ADMINS: 'Admins',
  ORDERS: 'Orders'
};

function getSs() {
  try {
    return SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {
    throw new Error("Could not access spreadsheet. Ensure the script is bound to a Google Sheet.");
  }
}

/**
 * Secure SHA-256 Hashing helper.
 * Converts input string to a hex-encoded SHA-256 hash.
 */
function hashPassword(password) {
  if (!password) return "";
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password);
  var hash = '';
  for (var i = 0; i < digest.length; i++) {
    var byte = digest[i];
    if (byte < 0) byte += 256;
    var byteStr = byte.toString(16);
    if (byteStr.length == 1) byteStr = '0' + byteStr;
    hash += byteStr;
  }
  return hash;
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ 
    status: "OK", 
    message: "Subash Royal Backend is live!",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return createJsonResponse({ success: false, message: 'Invalid JSON body' });
  }

  var action = body.action;

  try {
    switch (action) {
      case 'getProducts':
        return createJsonResponse({ success: true, data: getTableData(SHEETS.PRODUCTS) });
      case 'getCategories':
        return createJsonResponse({ success: true, data: getTableData(SHEETS.CATEGORIES) });
      case 'getOrders':
        return createJsonResponse({ success: true, data: getOrders(body.customerId) });
      case 'login':
        return handleLogin(body.email, body.password);
      case 'register':
        return handleRegister(body.name, body.email, body.password);
      case 'createOrder':
        return handleCreateOrder(body.order);
      case 'updateOrderStatus':
        return handleUpdateOrderStatus(body.orderId, body.status);
      case 'addProduct':
        return handleAddProduct(body.product);
      case 'updateProduct':
        return handleUpdateProduct(body.product);
      case 'deleteProduct':
        return handleDeleteItem(SHEETS.PRODUCTS, body.id);
      case 'addCategory':
        return handleAddCategory(body.name);
      default:
        return createJsonResponse({ success: false, message: 'Action not found: ' + action });
    }
  } catch (err) {
    return createJsonResponse({ success: false, message: 'Server Error: ' + err.message });
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Fetches data from a specific sheet and converts it to an array of objects.
 * Automatically initializes the sheet with headers if it doesn't exist.
 */
function getTableData(sheetName) {
  var ss = getSs();
  var sheet = ss.getSheetByName(sheetName);
  
  var headersMap = {
    'Products': ['id', 'name', 'category', 'price', 'description', 'imageURL', 'activeStatus'],
    'Categories': ['id', 'name'],
    'Customers': ['id', 'name', 'email', 'passwordHash'],
    'Admins': ['id', 'name', 'email', 'passwordHash'],
    'Orders': ['orderId', 'customerId', 'itemsJSON', 'totalPrice', 'paymentStatus', 'orderStatus', 'createdAt']
  };

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (headersMap[sheetName]) {
      sheet.appendRow(headersMap[sheetName]);
    }
    return [];
  }

  var range = sheet.getDataRange();
  var rows = range.getNumRows();
  if (rows < 2) return [];

  var data = range.getValues();
  var headers = data.shift();
  return data.map(function(row) {
    var obj = {};
    headers.forEach(function(header, i) {
      if (header) obj[header] = row[i];
    });
    return obj;
  });
}

/**
 * Handles user authentication for both Admins and Customers.
 */
function handleLogin(email, password) {
  if (!email || !password) {
    return createJsonResponse({ success: false, message: 'Missing credentials' });
  }

  var cleanEmail = String(email).trim().toLowerCase();
  var incomingHash = hashPassword(password);

  // 1. Check Admins Sheet
  var admins = getTableData(SHEETS.ADMINS);
  var adminUser = admins.find(function(u) { 
    var sheetEmail = String(u.email || "").trim().toLowerCase();
    var sheetHash = String(u.passwordHash || "").trim();
    return sheetEmail === cleanEmail && sheetHash === String(incomingHash); 
  });

  if (adminUser) {
    return createJsonResponse({
      success: true,
      data: { user: { id: adminUser.id, name: adminUser.name, email: adminUser.email, role: 'admin' } }
    });
  }

  // 2. Fallback: Master Admin bypass for initial setup
  if (cleanEmail === 'admin@subash.com' && (password === 'admin123' || password === 'admin')) {
    return createJsonResponse({
      success: true,
      data: { user: { id: 'master-admin', name: 'Super Admin', email: email, role: 'admin' } }
    });
  }

  // 3. Check Customers Sheet
  var customers = getTableData(SHEETS.CUSTOMERS);
  var customerUser = customers.find(function(u) { 
    var sheetEmail = String(u.email || "").trim().toLowerCase();
    var sheetHash = String(u.passwordHash || "").trim();
    return sheetEmail === cleanEmail && sheetHash === String(incomingHash); 
  });

  if (customerUser) {
    return createJsonResponse({
      success: true,
      data: { user: { id: customerUser.id, name: customerUser.name, email: customerUser.email, role: 'customer' } }
    });
  }

  return createJsonResponse({ success: false, message: 'Invalid email or security key.' });
}

/**
 * Handles new customer registration.
 */
function handleRegister(name, email, password) {
  if (!name || !email || !password) {
    return createJsonResponse({ success: false, message: 'Name, Email, and Security Key are all required.' });
  }

  var ss = getSs();
  var sheet = ss.getSheetByName(SHEETS.CUSTOMERS);
  var cleanEmail = String(email).trim().toLowerCase();

  if (!sheet || sheet.getDataRange().getNumRows() === 0) {
    getTableData(SHEETS.CUSTOMERS); 
    sheet = ss.getSheetByName(SHEETS.CUSTOMERS);
  }

  var existingUsers = getTableData(SHEETS.CUSTOMERS);
  var isDuplicate = existingUsers.some(function(u) {
    return String(u.email || "").trim().toLowerCase() === cleanEmail;
  });

  if (isDuplicate) {
    return createJsonResponse({ success: false, message: 'An account with this email already exists.' });
  }

  var customerId = 'CUST-' + Utilities.getUuid().substring(0, 8).toUpperCase();
  var hashedPassword = hashPassword(password);
  
  sheet.appendRow([customerId, name, email, hashedPassword]);
  SpreadsheetApp.flush();

  return createJsonResponse({
    success: true,
    data: { user: { id: customerId, name: name, email: email, role: 'customer' } }
  });
}

function handleAddProduct(product) {
  var ss = getSs();
  var sheet = ss.getSheetByName(SHEETS.PRODUCTS);
  var id = 'PROD-' + Math.floor(Math.random() * 100000);
  sheet.appendRow([id, product.name, product.category, product.price, product.description, product.imageURL, true]);
  SpreadsheetApp.flush();
  return createJsonResponse({ success: true, data: id });
}

function handleUpdateProduct(product) {
  var ss = getSs();
  var sheet = ss.getSheetByName(SHEETS.PRODUCTS);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == product.id) {
      sheet.getRange(i + 1, 1, 1, 7).setValues([[
        product.id, product.name, product.category, product.price, product.description, product.imageURL, product.activeStatus
      ]]);
      SpreadsheetApp.flush();
      return createJsonResponse({ success: true });
    }
  }
  return createJsonResponse({ success: false, message: 'Product not found' });
}

function handleDeleteItem(sheetName, id) {
  var ss = getSs();
  var sheet = ss.getSheetByName(sheetName);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      sheet.deleteRow(i + 1);
      SpreadsheetApp.flush();
      return createJsonResponse({ success: true });
    }
  }
  return createJsonResponse({ success: false, message: 'Item not found' });
}

function handleAddCategory(name) {
  var ss = getSs();
  var sheet = ss.getSheetByName(SHEETS.CATEGORIES);
  var id = 'CAT-' + Math.floor(Math.random() * 10000);
  sheet.appendRow([id, name]);
  SpreadsheetApp.flush();
  return createJsonResponse({ success: true, data: id });
}

function handleCreateOrder(order) {
  var ss = getSs();
  var sheet = ss.getSheetByName(SHEETS.ORDERS);
  var orderId = 'ORD-' + Math.floor(Math.random() * 90000 + 10000);
  sheet.appendRow([orderId, order.customerId, order.itemsJSON, order.totalPrice, order.paymentStatus, order.orderStatus, order.createdAt]);
  SpreadsheetApp.flush();
  return createJsonResponse({ success: true, data: { orderId: orderId } });
}

function getOrders(customerId) {
  var orders = getTableData(SHEETS.ORDERS);
  return customerId ? orders.filter(function(o) { return String(o.customerId) === String(customerId); }) : orders;
}

function handleUpdateOrderStatus(orderId, status) {
  var ss = getSs();
  var sheet = ss.getSheetByName(SHEETS.ORDERS);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == orderId) {
      sheet.getRange(i + 1, 6).setValue(status);
      SpreadsheetApp.flush();
      return createJsonResponse({ success: true });
    }
  }
  return createJsonResponse({ success: false, message: 'Order ID not found' });
}
