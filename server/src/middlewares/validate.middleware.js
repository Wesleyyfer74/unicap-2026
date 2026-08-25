export function validate(schema) {
  return (request, response, next) => {
    const result = schema.safeParse({ body: request.body, params: request.params, query: request.query });
    if (!result.success) {
      return response.status(422).json({
        message: 'Dados inválidos',
        errors: result.error.issues.map(({ path, message }) => ({ field: path.slice(1).join('.'), message })),
      });
    }
    request.validated = result.data;
    return next();
  };
}
