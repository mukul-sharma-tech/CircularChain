Hi, I have fixed the build error and another potential runtime error. Here is the summary of the changes:

1.  Fixed the `Module not found` error in `src/app/hooks/useUserEarnings.ts` by correcting the import path for `AuthContext`.
2.  Fixed a potential runtime error in `src/app/hooks/useUserEarnings.ts` by correctly handling `bigint` for earnings calculations, which is used in `ethers` v6.

The application should now build and run correctly. Please test it and let me know if you have any feedback.