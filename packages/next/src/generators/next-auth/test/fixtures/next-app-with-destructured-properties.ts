// todo remove this

export default `function CustomApp({
    Component,
    pageProps: { something, ...pageProperties },
}: AppProps) {
    return (
        <SomeProvider>
            <Component {...pageProperties} />
        </SomeProvider>
    );
}
export default CustomApp;
`;
