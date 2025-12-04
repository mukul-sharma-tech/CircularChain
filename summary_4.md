Hi, I have fixed the build error. Here is the summary of the changes:

1.  Moved the `iron-session` type declaration from `src/lib/session.ts` to a new global declaration file `src/iron-session.d.ts`. This will ensure that the `user` property is correctly typed on the `IronSession` object across the application, which should resolve the `Property 'user' does not exist on type 'IronSession<object>'.` error.

The application should now build correctly. Please let me know if you have any other questions.