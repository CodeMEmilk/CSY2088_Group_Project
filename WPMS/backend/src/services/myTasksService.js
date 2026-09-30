import AppError from "../core/errors/AppError.js";

function createMyTasksService(repository) {
    async function list(userId) {
        if (!userId) throw new AppError("Authentication required.", 401);
        return repository.listByUser(userId);
    }

    return {list};
}

export default createMyTasksService;
