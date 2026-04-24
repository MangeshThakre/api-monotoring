import ResponseFormatter from "../utils/ResponseFormatter.js";
import logger from "../config/logger.js";
import clientContainer from "../../services/client/Dependencies/Dependencies.js";

const validateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers["x-api-key"];


    if (!apiKey) {
      logger.warn("API key missing in request", { path: req.path, ip: req.ip });
      return res
        .status(401)
        .json(ResponseFormatter.error("API key is required", 401));
    }

    // get client and api key details from the database
    const clientData =
      await clientContainer.service.clientService.getClientByApiKey(apiKey);

    if (!clientData) {
      logger.warn("Invalid API key provided", { path: req.path, ip: req.ip });
      return res
        .status(401)
        .json(ResponseFormatter.error("Invalid API key", 401));
    }
    
    const {client, apiKey: apiKeyRecord} = clientData;

  if (!client.isActive) {
            logger.warn('Inactive client attempted API access', {
                path: req.path,
                ip: req.ip,
                clientId: client._id,
            });
            return res
                .status(403)
                .json(ResponseFormatter.error('Client account is inactive', 403));
        }

        // Usage limits removed — no monthly usage checks

        // Check API key permissions
        if (!apiKeyRecord.permissions?.canIngest) {
            logger.warn('API key without ingest permission attempted access', {
                path: req.path,
                ip: req.ip,
                apiKeyId: apiKeyRecord._id,
            });
            return res
                .status(403)
                .json(ResponseFormatter.error('API key does not have ingest permissions', 403));
        }

        // No API key usage tracking required

        // Add client and API key info to request
        req.client = client;
        req.apiKey = apiKeyRecord;

        logger.debug('API key validated successfully', {
            clientId: client._id,
            clientName: client.name,
            apiKeyId: apiKeyRecord._id,
        });

        next();
    } catch (error) {
        logger.error('Error validating API key:', error);
        return res
            .status(500)
            .json(ResponseFormatter.error('Internal server error', 500));
    }
};

export default validateApiKey;
