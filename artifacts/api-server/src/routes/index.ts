import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import categoriesRouter from "./categories";
import cartRouter from "./cart";
import ordersRouter from "./orders";
import usersRouter from "./users";
import reviewsRouter from "./reviews";
import wishlistRouter from "./wishlist";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

router.use(healthRouter);
router.use(productsRouter);
router.use(categoriesRouter);
router.use(cartRouter);
router.use(ordersRouter);
router.use(usersRouter);
router.use(reviewsRouter);
router.use(wishlistRouter);
router.use(analyticsRouter);

export default router;
