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

export const endpoint = {
  iam,
  location,
  material,
  product,
}
