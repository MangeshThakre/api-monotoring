export const onboardSuperAdminSchema = {
  userName: {
    required: true
  },
  email: {
    required: true
  },
  password: {
    required: true,
    maxLength: 6
  }
};

export const registrationSchema = {
  userName: {
    required: true
  },
  email: {
    required: true
  },
  password: {
    required: true
  },
  role: {
    required: false
  }
};

export const loginSchema = {
  email: {
    required: true
  },
  password: {
    required: true
  }
};
