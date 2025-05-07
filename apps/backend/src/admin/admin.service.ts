// No NestJS decorators (@Injectable)
import {
  Admin as PrismaAdmin,
  PrismaClient,
  Commission as PrismaCommission,
  Payment as PrismaPayment,
} from "@packages/database";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  AppError, // Import base AppError
  BadRequestError,
  InternalServerError,
  NotFoundError,
} from "../common/errors/errors.js"; // Use .ts extension
const { sign } = jwt;

// Restore necessary GQL type imports, remove Restaurant related
import {
  Commission as GqlCommission,
  DashboardMetrics as GqlDashboardMetrics,
  // CreateRestaurantInput,
  PaymentWithCommission as GqlPaymentWithCommission,
  // UpdateRestaurantInput,
  LoginAdminInput,
} from "../generated/graphql-types.js";

// Define AuthenticationError locally if not imported
class AuthenticationError extends AppError {
  constructor(message: string) {
    super(message, 401, "UNAUTHENTICATED");
    this.name = "AuthenticationError";
  }
}

// Update helper functions to use Prisma types as input
const convertCommissionDates = (item: PrismaCommission): GqlCommission => {
  return {
    __typename: "Commission",
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
};

export class AdminService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Update return type to use Prisma type
  async login(input: LoginAdminInput): Promise<PrismaAdmin> {
    const { email, password } = input;
    const admin = await this.prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      throw new AuthenticationError("Invalid email or password");
    }

    const passwordMatch = await bcrypt.compare(password, admin.password);
    if (!passwordMatch) {
      throw new AuthenticationError("Invalid email or password");
    }

    return admin; // Return Prisma Admin object
  }

  // Update parameter type to use Prisma type
  generateToken(admin: PrismaAdmin): string {
    return sign(
      { id: admin.id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET || "super-secret-key-123",
      { expiresIn: "1h" }
    );
  }

  // --- Dashboard Metrics ---
  async getDashboardMetrics(): Promise<GqlDashboardMetrics> {
    try {
      const [
        restaurantCount,
        menuCount,
        orderCount,
        successfulPayments,
        commission,
      ] = await this.prisma.$transaction([
        this.prisma.admin.count({ where: { role: "restaurant_admin" } }),
        this.prisma.menu.count(),
        this.prisma.order.count(),
        this.prisma.payment.findMany({ where: { status: "succeeded" } }),
        this.prisma.commission.findUnique({
          where: { id: "default-commission" },
        }),
      ]);

      if (!commission) {
        console.warn(
          "Default commission setting not found. Ensure it's seeded."
        );
        throw new InternalServerError(
          "Commission setting not found. Please seed the database."
        );
      }

      const commissionPercentage = commission.percentage;
      const totalPaymentsAmount = successfulPayments.reduce(
        (sum: number, p: PrismaPayment) => sum + p.amount, // Use PrismaPayment type here
        0 // Initial value for sum
      );
      const totalCommissionAmount = totalPaymentsAmount * commissionPercentage;

      return {
        totalRestaurants: restaurantCount,
        totalMenus: menuCount,
        totalOrders: orderCount,
        totalPayments: totalPaymentsAmount,
        totalCommission: totalCommissionAmount,
      };
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      if (error instanceof AppError) throw error;
      throw new InternalServerError("Failed to retrieve dashboard metrics");
    }
  }

  // --- Restaurant Management Removed ---
  /*
  async getRestaurants(): Promise<GqlRestaurant[]> {
    console.warn(
      "getRestaurants called - returning empty array (placeholder)."
    );
    return [];
  }

  async createRestaurant(input: CreateRestaurantInput): Promise<GqlRestaurant> {
    console.warn(
      "createRestaurant called - throwing error (placeholder). Input:",
      input
    );
    throw new InternalServerError("Restaurant creation not implemented yet.");
  }

  async updateRestaurant(
    id: string,
    input: UpdateRestaurantInput
  ): Promise<GqlRestaurant> {
    console.warn(
      `updateRestaurant called for ID: ${id} - throwing error (placeholder). Input:`,
      input
    );
    throw new InternalServerError("Restaurant update not implemented yet.");
  }

  async deleteRestaurant(id: string): Promise<GqlRestaurant> {
    console.warn(
      `deleteRestaurant called for ID: ${id} - throwing error (placeholder).`
    );
    throw new InternalServerError("Restaurant deletion not implemented yet.");
  }
  */

  // --- Commission Management ---
  // Update return type to use GqlCommission directly
  async getCommission(): Promise<GqlCommission> {
    const commission = await this.prisma.commission.findUnique({
      where: { id: "default-commission" },
    });
    if (!commission) {
      throw new NotFoundError(
        "Commission setting 'default-commission' not found."
      );
    }
    // Use helper to map to GQL type
    return convertCommissionDates(commission);
  }

  // Update return type to use GqlCommission directly
  async updateCommission(percentageInput: number): Promise<GqlCommission> {
    if (percentageInput < 0 || percentageInput > 1) {
      throw new BadRequestError(
        "Commission percentage must be between 0 (0%) and 1 (100%). Example: 0.05 for 5%."
      );
    }
    try {
      // Use PrismaCommission type for updatedCommission
      const updatedCommission: PrismaCommission =
        await this.prisma.commission.update({
          where: { id: "default-commission" },
          data: { percentage: percentageInput },
        });
      // Use helper to map to GQL type
      return convertCommissionDates(updatedCommission);
    } catch (error) {
      console.error("Error updating commission:", error);
      if (error instanceof Error && "code" in error && error.code === "P2025") {
        throw new NotFoundError(
          "Commission setting 'default-commission' not found to update."
        );
      }
      throw new InternalServerError("Failed to update commission setting.");
    }
  }

  // --- Payment Listing ---
  async getPayments(): Promise<GqlPaymentWithCommission[]> {
    try {
      const commission = await this.prisma.commission.findUnique({
        where: { id: "default-commission" },
      });
      if (!commission) {
        throw new InternalServerError(
          "Commission setting not found. Cannot calculate payment breakdowns."
        );
      }
      const commissionPercentage = commission.percentage;

      const payments: PrismaPayment[] = await this.prisma.payment.findMany({
        orderBy: { createdAt: "desc" },
      });

      // Map directly to GQL type here
      return payments.map((p) => {
        const commissionAmount = p.amount * commissionPercentage;
        const netAmount = p.amount - commissionAmount;
        // Construct the GQLPaymentWithCommission object directly
        return {
          __typename: "PaymentWithCommission",
          id: p.id,
          orderId: p.orderId,
          amount: p.amount,
          status: p.status,
          paystackReference: p.paystackReference ?? undefined,
          commissionAmount: commissionAmount,
          netAmount: netAmount,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        };
      });
    } catch (error) {
      console.error("Error fetching payments with commission:", error);
      if (error instanceof AppError) throw error;
      throw new InternalServerError("Failed to retrieve payments.");
    }
  }
}
