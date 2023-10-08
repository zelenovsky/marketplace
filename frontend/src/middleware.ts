import { me } from "./services/api/auth";

export async function onRequest({ locals, request }, next) {
  const res = await me(request);

  const { user } = await res.json()

  locals.user = user;

  return next();
};