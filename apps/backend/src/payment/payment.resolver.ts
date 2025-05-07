import {
  InitializeTransactionResponse as GqlInitializeTransactionResponse,
  MutationInitializeTransactionArgs,
  Resolvers,
} from "../generated/graphql-types.js";
import { ContextValue } from "../index.js";
import { PaymentService } from "./payment.service.js";

export const paymentResolvers: Pick<Resolvers<ContextValue>, "Mutation"> = {
  Mutation: {
    initializeTransaction: async (
      _parent: unknown,
      { input }: MutationInitializeTransactionArgs,
      { prisma, paystack }: ContextValue
    ): Promise<GqlInitializeTransactionResponse> => {
      // Instantiating services here
      const paymentService = new PaymentService(prisma, paystack);
      // Assuming initializeTransaction returns the correct GQL type directly
      return paymentService.initializeTransaction(input);
    },
  },
};

export default paymentResolvers;
