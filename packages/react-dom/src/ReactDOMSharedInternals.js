/**
 * @flow
 */

type InternalsType = {
  Dispatcher: {
    current: mixed,
  },
};

const Internals: InternalsType = ({
  Dispatcher: {
    current: null,
  },
}: any);

export default Internals;
