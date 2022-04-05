function createBaseConfig({
    baseUrl,
    proxyPath,
    pathPatternReplace = {},
    response = {},
    responseFormat = 'application/json',
    headers = {},
    showLog = {}
}) {
    return {
        baseUrl,
        pathPatternReplace: {
            from: proxyPath || pathPatternReplace.from || '/proxy',
            to: pathPatternReplace.to || '',
        },
        response: {
            data: response.data,
            status: response.status
        },
        responseFormat,
        headers,
        showLog: {
            successResponse: showLog.successResponse || true
        }
    }
}

module.exports = createBaseConfig;