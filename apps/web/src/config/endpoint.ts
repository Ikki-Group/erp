const auth = { login: 'auth/login', me: 'auth/me' }

const iam = {
  user: {
    list: 'iam/user/list',
    detail: 'iam/user/detail',
    create: 'iam/user/create',
    update: 'iam/user/update',
    remove: 'iam/user/remove',
    changePassword: 'iam/user/change-password',
    adminUpdatePassword: 'iam/user/admin-update-password',
  },
  role: {
    list: 'iam/role/list',
    detail: 'iam/role/detail',
    create: 'iam/role/create',
    update: 'iam/role/update',
    remove: 'iam/role/remove',
  },
}

const location = {
  list: 'location/list',
  detail: 'location/detail',
  create: 'location/create',
  update: 'location/update',
  remove: 'location/remove',
}

const material = {
  list: 'material/list',
  detail: 'material/detail',
  create: 'material/create',
  update: 'material/update',
  remove: 'material/remove',
  category: {
    list: 'material/category/list',
    detail: 'material/category/detail',
    create: 'material/category/create',
    update: 'material/category/update',
    remove: 'material/category/remove',
  },
  uom: {
    list: 'material/uom/list',
    detail: 'material/uom/detail',
    create: 'material/uom/create',
    update: 'material/uom/update',
    remove: 'material/uom/remove',
  },
  location: {
    assign: 'material/location/assign',
    unassign: 'material/location/unassign',
    byMaterial: 'material/location/by-material',
    stock: 'material/location/stock',
    config: 'material/location/config',
  },
}

const product = {
  list: 'product/list',
  detail: 'product/detail',
  create: 'product/create',
  update: 'product/update',
  remove: 'product/remove',
  category: {
    list: 'product/category/list',
    detail: 'product/category/detail',
    create: 'product/category/create',
    update: 'product/category/update',
    remove: 'product/category/remove',
  },
  salesType: {
    list: 'product/sales-type/list',
    detail: 'product/sales-type/detail',
    create: 'product/sales-type/create',
    update: 'product/sales-type/update',
    remove: 'product/sales-type/remove',
  },
}

const recipe = {
  list: 'recipe/list',
  detail: 'recipe/detail',
  create: 'recipe/create',
  update: 'recipe/update',
  remove: 'recipe/remove',
}

const inventory = {
  summary: {
    byLocation: 'inventory/summary/by-location',
    ledger: 'inventory/summary/ledger',
    generate: 'inventory/summary/generate',
  },
  transaction: {
    list: 'inventory/transaction/list',
    detail: 'inventory/transaction/detail',
    purchase: 'inventory/transaction/purchase',
    transfer: 'inventory/transaction/transfer',
    adjustment: 'inventory/transaction/adjustment',
    opname: 'inventory/transaction/opname',
  },
}

const dashboard = {
  analytics: {
    pnl: 'dashboard/analytics/pnl',
    topSales: 'dashboard/analytics/top-sales',
  },
  settings: {
    summary: 'dashboard/settings/summary',
  },
}

const employee = {
  list: 'employee/list',
  detail: 'employee/detail',
  create: 'employee/create',
  update: 'employee/update',
  remove: 'employee/remove',
}

const finance = {
  account: {
    list: 'finance/account/list',
    detail: 'finance/account/detail',
    create: 'finance/account/create',
    update: 'finance/account/update',
    remove: 'finance/account/remove',
  },
  journal: {
    entries: 'finance/entries',
    detail: 'finance/entries/:id',
  },
}

const hr = {
  shifts: {
    list: 'hr/shifts',
    create: 'hr/shifts',
  },
  attendances: {
    list: 'hr/attendances',
  },
  clockIn: 'hr/clock-in',
  clockOut: 'hr/clock-out',
  payroll: {
    batches: {
      create: 'hr/payroll/batches',
    },
    adjustments: {
      create: 'hr/payroll/adjustments',
    },
  },
}

const moka = {
  configuration: {
    list: 'moka/configuration/list',
    detail: 'moka/configuration/detail',
    create: 'moka/configuration/create',
    update: 'moka/configuration/update',
    remove: 'moka/configuration/remove',
  },
  scrap: {
    history: 'moka/scrap/history',
    trigger: 'moka/scrap/trigger',
  },
}

const production = {
  workOrder: {
    list: 'production/work-order/list',
    detail: 'production/work-order/detail',
    create: 'production/work-order/create',
    update: 'production/work-order/update',
    remove: 'production/work-order/remove',
  },
}

const purchasing = {
  order: {
    list: 'purchasing/purchase-order/list',
    detail: 'purchasing/purchase-order/detail',
    create: 'purchasing/purchase-order/create',
    update: 'purchasing/purchase-order/update',
    remove: 'purchasing/purchase-order/remove',
  },
  goodsReceipt: {
    list: 'purchasing/goods-receipt/list',
    detail: 'purchasing/goods-receipt/detail',
    create: 'purchasing/goods-receipt/create',
    update: 'purchasing/goods-receipt/update',
    remove: 'purchasing/goods-receipt/remove',
  },
}

const sales = {
  order: {
    list: 'sales/order/list',
    detail: 'sales/order/detail',
    create: 'sales/order/create',
    update: 'sales/order/update',
    remove: 'sales/order/remove',
    addBatch: 'sales/order/add-batch',
    close: 'sales/order/close',
    void: 'sales/order/void',
  },
}

const supplier = {
  list: 'supplier/list',
  detail: 'supplier/detail',
  create: 'supplier/create',
  update: 'supplier/update',
  remove: 'supplier/remove',
}

export const endpoint = {
  auth,
  iam,
  location,
  material,
  product,
  recipe,
  inventory,
  dashboard,
  employee,
  finance,
  hr,
  moka,
  production,
  purchasing,
  sales,
  supplier,
}

