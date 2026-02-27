const iam = {
  user: {
    list: 'iam/user/list',
    detail: 'iam/user/detail',
    create: 'iam/user/create',
    update: 'iam/user/update',
    remove: 'iam/user/remove',
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
  category: {
    list: 'materials/category/list',
    detail: 'materials/category/detail',
    create: 'materials/category/create',
    update: 'materials/category/update',
    remove: 'materials/category/remove',
  },
}

export const endpoint = {
  iam,
  location,
  material,
}
