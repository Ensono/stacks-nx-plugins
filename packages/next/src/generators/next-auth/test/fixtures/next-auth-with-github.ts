export default `import NextAuth from 'next-auth';
const nextAuth = NextAuth({
  providers: [
    GithubProvider({})
  ]
});
default export nextAuth;
`;
