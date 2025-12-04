Hi, I have fixed the bug and implemented the requested changes. Here is the summary of the changes:

1.  Fixed the `no matching fragment` error by correcting the ABI for `buyerConfirmDelivery` in `src/lib/constants.ts`.
2.  Cleaned up `src/components/OrderCard.tsx` and `src/app/hooks/useOrders.ts` by removing commented-out code and fixing typos.
3.  Created a new hook `useUserEarnings` to calculate and provide the user's total earnings from the smart contract.
4.  Added a "My Earnings" section to the user's dashboard (`src/app/dashboard/page.tsx`) to display their total earnings. This is displayed for both "user" and "agent" roles.

Please test the application and let me know if you have any feedback.