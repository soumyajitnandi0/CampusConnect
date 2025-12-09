const SignupUseCase = require('../../application/useCases/auth/SignupUseCase');
const LoginUseCase = require('../../application/useCases/auth/LoginUseCase');
const SyncUserUseCase = require('../../application/useCases/auth/SyncUserUseCase');
const asyncHandler = require('../middleware/asyncHandler');

class AuthController {
  /**
   * @route POST /api/auth/signup
   * @desc Register new user
   * @access Public
   */
  signup = asyncHandler(async (req, res) => {
    const { name, email, password, role, rollNo, yearSection } = req.body;

    const signupUseCase = new SignupUseCase();
    const result = await signupUseCase.execute({
      name,
      email,
      password,
      role,
      rollNo,
      yearSection,
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  });

  /**
   * @route POST /api/auth/login
   * @desc Login user
   * @access Public
   */
  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const loginUseCase = new LoginUseCase();
    const result = await loginUseCase.execute({ email, password });

    res.json({
      success: true,
      data: result,
    });
  });

  /**
   * @route POST /api/auth/sync
   * @desc Sync user from Supabase OAuth
   * @access Private
   */
  syncUser = asyncHandler(async (req, res) => {
    const { role, rollNo, yearSection } = req.body;
    const tokenUser = req.user; // Set by auth middleware

    const syncUserUseCase = new SyncUserUseCase();
    const result = await syncUserUseCase.execute({
      tokenUser,
      role,
      rollNo,
      yearSection,
    });

    res.json({
      success: true,
      data: result,
    });
  });
}

module.exports = new AuthController();


