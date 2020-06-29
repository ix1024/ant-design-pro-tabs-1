import menu from '../locales/zh-CN/menu';
import config from '../../config/config';

const GlobalModel = {
  namespace: 'tabs',
  state: {
    pathname: '/',
    pageName: 'New Page Tab',
    paths: [],
    pages: [],
  },
  effects: {},
  reducers: {
    // 设置当前Path
    setCurrentPath(state, { payload }) {
      const { pathname, pageName } = payload;
      return { ...state, pathname, pageName };
    },
    // 添加路径
    addPath(state, { payload }) {
      const { pathname } = payload;
      const { paths } = state;
      if (!paths.some(path => path === pathname)) {
        paths.push(pathname);
      }
      return { ...state, paths };
    },
  },
  subscriptions: {
    setupHistory({ dispatch, history }) {
      const getName = (routes = [], parentName, pathname) => {
        const list = [];
        routes.forEach(item => {
          // eslint-disable-next-line no-shadow
          const { routes, name } = item;
          const pName = parentName && name ? `${parentName}.${name}` : parentName || name;

          if (routes && routes.length) {
            list.push(...getName(routes, pName, pathname));
          } else if (pName && name) {
            if (item.path === pathname) {
              list.push(pName);
            }
          }
        });
        return list;
      };
      // 监听路由变化
      return history.listen(({ pathname, search }) => {
        if (pathname === '/') {
          return;
        }

        // 获取姓名
        // let searchObj = parse(search);
        let name = '';
        // Object.keys(searchObj).forEach(item => {
        //   if (item.includes('pageName')) {
        //     name = searchObj[item] + '详情';
        //     return;
        //   }
        // });

        name = pathname.substr(pathname.lastIndexOf('/') + 1);

        const pageName = menu[getName(config.routes, 'menu', pathname)[0]] || name;
        dispatch({ type: 'setCurrentPath', payload: { pathname, pageName } });
        dispatch({ type: 'addPath', payload: { pathname, pageName } });
      });
    },
    setup({ history }) {
      // Subscribe history(url) change, trigger `load` action if pathname is `/`
      history.listen(({ pathname, search }) => {
        if (typeof window.ga !== 'undefined') {
          window.ga('send', 'pageview', pathname + search);
        }
      });
    },
  },
};
export default GlobalModel;
