export default `function SomeProvider({ children }: PropsWithChildren) {
    return <>{children}</>;
}
function CustomApp({
    Component,
    pageProps,
}: AppProps) {
    return (
        <SomeProvider>
            <Component {...pageProps} />
        </SomeProvider>
    );
}
export default CustomApp;
`;
