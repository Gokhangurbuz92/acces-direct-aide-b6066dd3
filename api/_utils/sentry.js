import Sentry from './sentryServer.js';

export const setUserContext = (user) => {
  Sentry.setUser(user);
};

export const setTags = (tags) => {
  Sentry.setTags(tags);
};

export default Sentry;
