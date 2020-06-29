/**
 * @name 标签页组件
 * @Author hz16042180
 * @Date 2019-11-13
 * @param children {ReactElement} umi框架中page目录下的页面组件
 * @example
 *   import PageTab from '@/layouts/PageTab';
 *   <PageTab>{children}</PageTab>
 */

import { connect } from 'dva';
import router from 'umi/router';
import React, { Component } from 'react';
import HTML5Backend from 'react-dnd-html5-backend';
import { DndProvider, DragSource, DropTarget } from 'react-dnd';
import { Tabs, Menu, Dropdown, Tooltip, Icon, message } from 'antd';
import pageTabStyle from './PageTab.less';

const { TabPane } = Tabs;
const TABS_NOT_TIPS = 'TABS_NOT_TIPS';

// Drag & Drop node
class TabNode extends React.Component {
  render() {
    const { connectDragSource, connectDropTarget, children } = this.props;

    return connectDragSource(connectDropTarget(children));
  }
}

const cardTarget = {
  drop(props, monitor) {
    const dragKey = monitor.getItem().index;
    const hoverKey = props.index;

    if (dragKey === hoverKey) {
      return;
    }

    props.moveTabNode(dragKey, hoverKey);
    monitor.getItem().index = hoverKey;
  },
};

const cardSource = {
  beginDrag(props) {
    return {
      id: props.id,
      index: props.index,
    };
  },
};

const WrapTabNode = DropTarget('DND_NODE', cardTarget, connect => ({
  connectDropTarget: connect.dropTarget(),
}))(
  DragSource('DND_NODE', cardSource, (connect, monitor) => ({
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging(),
  }))(TabNode),
);

class DraggableTabs extends React.Component {
  state = {
    order: [],
  };

  moveTabNode = (dragKey, hoverKey) => {
    const newOrder = this.state.order.slice();
    const { children } = this.props;

    React.Children.forEach(children, c => {
      if (newOrder.indexOf(c.key) === -1) {
        newOrder.push(c.key);
      }
    });

    const dragIndex = newOrder.indexOf(dragKey);
    const hoverIndex = newOrder.indexOf(hoverKey);

    newOrder.splice(dragIndex, 1);
    newOrder.splice(hoverIndex, 0, dragKey);

    this.setState({
      order: newOrder,
    });
  };

  renderTabBar = (props, DefaultTabBar) => (
    <DefaultTabBar {...props}>
      {node => (
        <WrapTabNode key={node.key} index={node.key} moveTabNode={this.moveTabNode}>
          {node}
        </WrapTabNode>
      )}
    </DefaultTabBar>
  );

  render() {
    const { order } = this.state;
    const { children } = this.props;

    const tabs = [];
    React.Children.forEach(children, c => {
      tabs.push(c);
    });

    const orderTabs = tabs.slice().sort((a, b) => {
      const orderA = order.indexOf(a.key);
      const orderB = order.indexOf(b.key);

      if (orderA !== -1 && orderB !== -1) {
        return orderA - orderB;
      }
      if (orderA !== -1) {
        return -1;
      }
      if (orderB !== -1) {
        return 1;
      }

      const ia = tabs.indexOf(a);
      const ib = tabs.indexOf(b);

      return ia - ib;
    });

    return (
      <DndProvider backend={HTML5Backend}>
        <Tabs renderTabBar={this.renderTabBar} {...this.props}>
          {orderTabs}
        </Tabs>
      </DndProvider>
    );
  }
}

@connect(({ tabs }) => ({
  tabs,
}))
class App extends Component {
  state = { pages: [] };

  componentDidMount() {
    this.getData();
    this.preventDefault = this.preventDefault.bind(this);
  }

  componentDidUpdate(preProps) {
    const { tabs } = this.props;
    const { pathname } = tabs;
    console.log(pathname, preProps.tabs.pathname);
    if (pathname !== preProps.tabs.pathname) {
      // 当路由发生改变时，显示相应tab页面
      this.getData();
    }
  }

  getData = () => {
    const { tabs, children } = this.props;
    const { pathname, pageName } = tabs;
    const { pages } = this.state;
    const myPage = Object.assign([], pages);

    // 如果是新开标签页，push到tabs标签页数组中，并设置当前激活页面
    if (pathname !== '/' && !pages.some(page => page.key === pathname)) {
      myPage.push({ key: pathname, title: pageName, content: children });
    }
    this.setState({ pages: myPage, activeKey: pathname });
  };

  onEdit = targetKey => {
    /**
     * 参照chrome标签页操作，如果关闭当前页的话：
     * 1. 关闭中间某一标签页，选中该页后一页；
     * 2. 关闭最后一页标签页，选中该页前一页；
     * 3. 仅剩一页时不能删除
     */
    const { pages = [] } = this.state;
    let { activeKey } = this.state;
    let index = null;
    index = pages.findIndex(page => page.key === targetKey);
    if (activeKey === targetKey) {
      const len = pages.length;
      if (index === len - 1) {
        activeKey = pages[len - 2].key;
      } else {
        activeKey = pages[index + 1].key;
      }
    }
    pages.splice(index, 1);
    this.setState({ pages }, () => {
      router.push(activeKey);
    });
  };

  closeOhterTabs(key, direction) {
    const { pages } = this.state;
    if (pages.length <= 1) {
      return;
    }
    let cIndex = 0;
    const newPages = pages
      .map((item, index) => {
        if (item.key === key) {
          cIndex = index;
        }
        return item;
      })
      .map((item, index) => {
        if (direction === 'left') {
          if (index < cIndex) {
            return undefined;
          }
        } else if (direction === 'right') {
          if (index > cIndex) {
            return undefined;
          }
        } else if (item.key !== key) {
          return undefined;
        }
        return item;
      })
      .filter(item => item);
    this.setState({ pages: newPages });
  }

  // eslint-disable-next-line class-methods-use-this
  preventDefault(ev) {
    ev.preventDefault();
    ev.stopPropagation();
  }

  render() {
    const { pages = [], activeKey, cKey } = this.state;
    const menu = pane => {
      const { key, title } = pane;
      let leftDisabled = false;
      let rightDisabled = false;
      pages.forEach((item, index) => {
        if (item.key === key) {
          if (index > pages.length - 2) {
            rightDisabled = true;
          }
          if (index === 0) {
            leftDisabled = true;
          }
        }
      });
      return (
        <Menu style={{ marginTop: 8 }}>
          {/* <Menu.Item
            disabled={pages.length <= 1}
            onClick={() => {
              this.onEdit(key);
            }}
          >
            <Tooltip placement="left" title={title}>
              关闭
            </Tooltip>
          </Menu.Item> */}
          <Menu.Item
            disabled={pages.length <= 1}
            onContextMenu={this.preventDefault}
            onClick={() => {
              this.closeOhterTabs(key);
            }}
          >
            <Icon type="close-circle" />
            关闭其他标签页
          </Menu.Item>
          <Menu.Item
            disabled={pages.length <= 1 || rightDisabled}
            onContextMenu={this.preventDefault}
            onClick={() => {
              this.closeOhterTabs(key, 'right');
            }}
          >
            <Icon type="close-circle" />
            关闭右侧标签页
          </Menu.Item>
          <Menu.Item
            disabled={pages.length <= 1 || leftDisabled}
            onContextMenu={this.preventDefault}
            onClick={() => {
              this.closeOhterTabs(key, 'left');
            }}
          >
            <Icon type="close-circle" />
            关闭左侧标签页
          </Menu.Item>
          <Menu.Divider />
          <Menu.Item
            onContextMenu={this.preventDefault}
            onClick={() => {
              this.setState({ cKey: Date.now() }, () => {
                message.success('页面已经刷新');
              });
            }}
          >
            <span title={`刷新-${title}`}>
              <Icon type="reload" />
              刷新当前页面
            </span>
          </Menu.Item>
          <Menu.Item
            onContextMenu={this.preventDefault}
            onClick={() => {
              window.location.reload(true);
            }}
          >
            <span title="强制刷新浏览器">
              <Icon type="reload" />
              刷新浏览器
            </span>
          </Menu.Item>
        </Menu>
      );
    };
    return (
      <div>
        <DraggableTabs
          className={`page-tab 9999999999999999999999999999 ${pageTabStyle.page}`}
          hideAdd
          activeKey={activeKey}
          type="editable-card"
          onEdit={this.onEdit}
          onTabClick={ev => {
            router.push(ev);
          }}
        >
          {pages.map(pane => {
            return (
              <TabPane
                tab={
                  <Dropdown trigger={['contextMenu']} overlay={menu(pane)}>
                    <Tooltip
                      overlayStyle={{ maxWidth: 380, top: 20 }}
                      title={
                        localStorage.getItem(TABS_NOT_TIPS) ? (
                          undefined
                        ) : (
                          <div style={{ fontSize: 14, width: 380 }}>
                            <div>1、点击鼠标右键可以操作标签页面；</div>
                            <div>
                              2、双击标签页标题可以刷新当前页； 我已知道，
                              <span
                                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                onClick={() => {
                                  message.success('操作成功，已不再提示');

                                  localStorage.setItem(TABS_NOT_TIPS, true);
                                }}
                              >
                                不再提示
                              </span>
                            </div>
                          </div>
                        )
                      }
                    >
                      <span
                        style={{ display: 'inline-block' }}
                        onDoubleClick={() => {
                          this.setState({ cKey: Date.now() }, () => {
                            message.success('页面已经刷新');
                          });
                        }}
                      >
                        {pane.title}
                      </span>
                    </Tooltip>
                  </Dropdown>
                }
                key={pane.key}
                closable={pages.length > 1}
                style={{ background: 'transparent', margin: 0 }}
              >
                <div key={cKey}>{pane.content}</div>
              </TabPane>
            );
          })}
        </DraggableTabs>
      </div>
    );
  }
}

export default App;
