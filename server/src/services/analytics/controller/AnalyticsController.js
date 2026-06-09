import logger from "../../../shared/config/logger.js";
import ResponseFormatter from "../../../shared/utils/ResponseFormatter.js";

export default class AnalyticsController {
  constructor({ AnalyticsService, AuthService, ClientRepository }) {
    if (!AnalyticsService)
      throw new Error("AnalyticsController requires a AnalyticsService");
    if (!AuthService)
      throw new Error("AnalyticsController requires a AuthService");
    if (!ClientRepository)
      throw new Error("AnalyticsController requires a ClientRepository");

    this.AnalyticsService = AnalyticsService;
    this.AuthService = AuthService;
    this.ClientRepository = ClientRepository;
  }

  async ensureCanViewAnalytics(req) {
    if (!req.user || !req.user._id) {
      throw new AppError("Authentication required", 400);
    }

    const isSuperAdmin = await this.AuthService.checkSuperAdminPermission(
      req.user._id
    );
    if (isSuperAdmin) return true;

    const profile = await this.AuthService.getUser(req.user._id);

    if (
      !profile ||
      !profile.permissions ||
      !profile.permissions.canViewAnalytics
    ) {
      throw new AppError("Insufficient permission to see analytics", 400);
    }
    return false;
  }

  async resolveFinalClientId(req, isSuperAdmin) {
    const queryClientId = req.query.clientId;
    const userClientId = req.user?.clientId;
    if (isSuperAdmin) {
      if (queryClientId) {
        if (!this.isValidObjectId(queryClientId)) {
          throw new AppError("invalid ClientId Formate", 400);
        }

        const clientId = await this.ClientRepository.findById(queryClientId);
        if (!clientId) throw new AppError("client not found", 400);

        return queryClientId;
      }
      return null;
    }

    if (!userClientId) {
      throw new AppError("Access denied - no client  association", 403);
    }

    if (!this.isValidObjectId(userClientId)) {
      throw new AppError("invalid Client association ", 400);
    }

    const client = await this.ClientRepository.findById(userClientId);
    if (!client) throw new AppError("client not found", 400);
    return userClientId;
  }

  validateTimeRange(startTime, endTime) {
    const parseValue = (v) => {
      if (v === undefined || v === null || v === "") return null;

      if (/^\d+$/.test(String(v))) return Number(v);

      const parsed = Date.parse(String(v));
      return Number.isNaN(parsed) ? NaN : parsed;
    };

    const start = parseValue(startTime);
    const end = parseValue(endTime);

    if ((startTime && Number.isNaN(start)) || (endTime && Number.isNaN(end))) {
      throw new AppError("Invalid time format", 400);
    }

    if (start !== null && end !== null && start > end) {
      throw new AppError("Invalid time range: start > end", 400);
    }
    return { startTime: start, endTime: end };
  }

  isValidObjectId(id) {
    return typeof id === "string" && /^[a-fA-F0-9]{24}$/.test(id);
  }

  async getOverAllStatics(req, res, next) {
    try {
      const { startTime, endTime } = req.query;
      console.log(startTime, endTime, "controller");
      const clientId = req.user.clientId;

      const isAdmin = await this.ensureCanViewAnalytics(req);
      const finalClientId = await this.resolveFinalClientId(req, isAdmin);
      const timeRange = this.validateTimeRange(startTime, endTime);

      const stats = await this.AnalyticsService.getOverAllStatics(
        finalClientId,
        timeRange
      );

      res
        .status(200)
        .json(
          ResponseFormatter.success(stats, "statics retrieved successfully ")
        );
    } catch (error) {
      logger.error(
        "Error during getting statics : Analytics controller:",
        error
      );
      res.status(400).json(ResponseFormatter.error(error.message, error.code));
    }
  }

  async getDashboard(req, res, next) {
    try {
      const { startTime, endTime } = req.query;
      const clientId = req.user.clientId;

      const isSuperAdmin = await this.ensureCanViewAnalytics(req);
      const finalClientId = await this.resolveFinalClientId(req, isSuperAdmin);
      const timeRange = this.validateTimeRange(startTime, endTime);

      const result = await Promise.allSettled([
        this.AnalyticsService.getOverAllStatics(finalClientId, timeRange),
        this.AnalyticsService.getTopEndpoints(finalClientId, {
          limit: 5,
          startTime: timeRange.startTime
        }),
        this.AnalyticsService.getTimeSeries(finalClientId, {
          ...timeRange,
          limit: 24
        })
      ]);

      const [stats, topEndpoints, recentTimeSeries] = result.map((item) =>
        item.status === "fulfilled" ? item.value : null
      );

      const dashboard = {
        stats,
        topEndpoints,
        recentActivity: recentTimeSeries
      };

      res
        .status(200)
        .json(
          ResponseFormatter.success(
            dashboard,
            "Dashboard data retrieved successfully",
            200
          )
        );
    } catch (error) {
      next(error);
    }
  }
}
