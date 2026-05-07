import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import acceptInvitationRouter from "./accept-invitation.js";
import resendInviteRouter from "./resend-invite.js";
import deleteSpeakerRouter from "./delete-speaker.js";
import manageSpeakerAccountRouter from "./manage-speaker-account.js";
import deleteUserRouter from "./delete-user.js";
import resetSpeakerPasswordRouter from "./reset-speaker-password.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(acceptInvitationRouter);
router.use(resendInviteRouter);
router.use(deleteSpeakerRouter);
router.use(manageSpeakerAccountRouter);
router.use(deleteUserRouter);
router.use(resetSpeakerPasswordRouter);

export default router;
