export default `function SomeProvider({ children }: PropsWithChildren) {
    return <>{children}</>;

function RootLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <html lang="en">
        <body>
        <SomeProvider>
          {children}
          </SomeProvider>
        </body>
      </html>
    );
  }
  
  export default RootLayout;
  `;
