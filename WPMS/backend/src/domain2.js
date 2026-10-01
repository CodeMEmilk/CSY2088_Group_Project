import {createTaskRepository} from "./repositories/mysqlTaskRepository.js";
import createTaskService from "./services/taskService.js";
import createTaskController from "./controllers/taskController.js";
import registerTaskRoutes from "./routes/taskRoutes.js";
import createTaskContextService from "./services/taskContextService.js";
import createTaskContextController from "./controllers/taskContextController.js";
import registerTaskContextRoutes from "./routes/taskContextRoutes.js";
import {createNotificationRepository} from "./repositories/mysqlNotificationRepository.js";
import createDependencyService from "./services/dependencyService.js";
import createDependencyController from "./controllers/dependencyController.js";
import registerDependencyRoutes from "./routes/dependencyRoutes.js";
import createNotificationService from "./services/notificationService.js";
import createNotificationController from "./controllers/notificationController.js";
import registerNotificationRoutes from "./routes/notificationRoutes.js";
import {createTimeLogRepository} from "./repositories/mysqlTimeLogRepository.js";
import createTimeLogService from "./services/timeLogService.js";
import createTimeLogController from "./controllers/timeLogController.js";
import registerTimeLogRoutes from "./routes/timeLogRoutes.js";
import {createMyTasksRepository} from "./repositories/mysqlMyTasksRepository.js";
import createMyTasksService from "./services/myTasksService.js";
import createMyTasksController from "./controllers/myTasksController.js";
import registerMyTasksRoutes from "./routes/myTasksRoutes.js";
import {createProjectTimelineRepository} from "./repositories/mysqlProjectTimelineRepository.js";
import createProjectTimelineService from "./services/projectTimelineService.js";
import createTimelinePropagationService from "./services/timelinePropagationService.js";
import createProjectTimelineController from "./controllers/projectTimelineController.js";
import registerProjectTimelineRoutes from "./routes/projectTimelineRoutes.js";
import createAttachmentService from "./services/attachmentService.js";
import createAttachmentController from "./controllers/attachmentController.js";
import registerAttachmentRoutes from "./routes/attachmentRoutes.js";
import {createWorkloadRepository} from "./repositories/mysqlWorkloadRepository.js";
import createEffortService from "./services/effortService.js";
import createEffortController from "./controllers/effortController.js";
import registerEffortRoutes from "./routes/effortRoutes.js";
import createWorkloadService from "./services/workloadService.js";
import createWorkloadController from "./controllers/workloadController.js";
import registerWorkloadRoutes from "./routes/workloadRoutes.js";
import createTaskSlaService from "./services/taskSlaService.js";
import createTaskSlaController from "./controllers/taskSlaController.js";
import registerTaskSlaRoutes from "./routes/taskSlaRoutes.js";

export function setupDomain2(router, {pool, requireAuth, guards, memberships}) {
    const taskRepository = createTaskRepository(pool);
    const notificationRepository = createNotificationRepository(pool);
    const timelinePropagationService = createTimelinePropagationService(taskRepository);
    const taskService = createTaskService(
        taskRepository,
        memberships,
        notificationRepository,
        timelinePropagationService
    );
    const taskController = createTaskController(taskService);
    const taskContextService = createTaskContextService(taskRepository);
    const taskContextController = createTaskContextController(taskContextService);
    const dependencyService = createDependencyService(taskRepository);
    const dependencyController = createDependencyController(dependencyService);
    const notificationService = createNotificationService(notificationRepository);
    const notificationController = createNotificationController(notificationService);
    const timeLogRepository = createTimeLogRepository(pool);
    const timeLogService = createTimeLogService(timeLogRepository, taskRepository);
    const timeLogController = createTimeLogController(timeLogService);
    const myTasksRepository = createMyTasksRepository(pool);
    const myTasksService = createMyTasksService(myTasksRepository);
    const myTasksController = createMyTasksController(myTasksService);
    const projectTimelineRepository = createProjectTimelineRepository(pool);
    const projectTimelineService = createProjectTimelineService(projectTimelineRepository);
    const projectTimelineController = createProjectTimelineController(projectTimelineService);
    const attachmentService = createAttachmentService(taskRepository);
    const attachmentController = createAttachmentController(attachmentService);
    const effortService = createEffortService(taskRepository, timeLogRepository);
    const effortController = createEffortController(effortService);
    const workloadRepository = createWorkloadRepository(pool);
    const workloadService = createWorkloadService(workloadRepository);
    const workloadController = createWorkloadController(workloadService);
    const taskSlaService = createTaskSlaService(taskRepository);
    const taskSlaController = createTaskSlaController(taskSlaService);

    registerTaskRoutes(
        router,
        taskController,
        requireAuth,
        guards
    );

    registerTaskContextRoutes(
        router,
        taskContextController,
        requireAuth,
        guards
    );

    registerDependencyRoutes(
        router,
        dependencyController,
        requireAuth,
        guards
    );

    registerNotificationRoutes(
        router,
        notificationController,
        requireAuth
    );

    registerTimeLogRoutes(
        router,
        timeLogController,
        requireAuth,
        guards
    );

    registerMyTasksRoutes(
        router,
        myTasksController,
        requireAuth
    );

    registerProjectTimelineRoutes(
        router,
        projectTimelineController,
        requireAuth,
        guards
    );

    registerAttachmentRoutes(
        router,
        attachmentController,
        requireAuth,
        guards
    );

    registerEffortRoutes(
        router,
        effortController,
        requireAuth,
        guards
    );

    registerWorkloadRoutes(
        router,
        workloadController,
        requireAuth
    );

    registerTaskSlaRoutes(
        router,
        taskSlaController,
        requireAuth,
        guards
    );

    return {
        taskRepository,
        taskService,
        timelinePropagationService,
        taskController,
        taskContextService,
        taskContextController,
        dependencyService,
        dependencyController,
        notificationRepository,
        notificationService,
        notificationController,
        timeLogRepository,
        timeLogService,
        timeLogController,
        myTasksRepository,
        myTasksService,
        myTasksController,
        projectTimelineRepository,
        projectTimelineService,
        projectTimelineController,
        attachmentService,
        attachmentController,
        effortService,
        effortController,
        workloadRepository,
        workloadService,
        workloadController,
        taskSlaService,
        taskSlaController
    };
}
