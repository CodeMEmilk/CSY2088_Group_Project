import AppError from "../core/errors/AppError.js";
import { sendSuccess } from "../core/http/response.js";

function createAnalyticsController(service) {
    function getAuthenticatedUserId(request) {
        const userId = request.user?.user_id;

        if (!userId) {
            throw new AppError(
                "Authentication required.",
                401
            );
        }

        return userId;
    }

    function getPeriod(context) {
        const now = new Date();

        const defaultYear = now.getFullYear();
        const defaultQuarter =
            Math.floor(now.getMonth() / 3) + 1;

        return {
            year: context.query.year ?? defaultYear,
            quarter: context.query.quarter ?? defaultQuarter
        };
    }

    async function getMyQuarter(
        request, response, context
    ) {
        const userId = getAuthenticatedUserId(request);
        const { year, quarter } = getPeriod(context);

        const metrics = await service.getIndividualQuarter(
            userId,
            year,
            quarter
        );

        sendSuccess(response, { metrics });
    }

    async function getProjectQuarter(
        request, response, context
    ) {
        const userId = getAuthenticatedUserId(request);
        const { year, quarter } = getPeriod(context);

        const projectId = context.params.projectId;

        if (!/^[1-9]\d*$/.test(projectId)) {
            throw new AppError(
                "Invalid project ID.",
                400
            );
        }

        const metrics = await service.getProjectQuarter(
            projectId,
            userId,
            year,
            quarter
        );

        sendSuccess(response, { metrics });
    }

    return {
        getMyQuarter,
        getProjectQuarter
    };
}

export default createAnalyticsController;