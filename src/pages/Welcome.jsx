import React, { Component } from 'react';
import { Typography, Divider } from 'antd';
import { PageHeaderWrapper } from '@ant-design/pro-layout';

const { Title, Paragraph } = Typography;

// eslint-disable-next-line react/prefer-stateless-function
class ReactBeautifulDndHorizontal extends Component {
  render() {
    return (
      <PageHeaderWrapper>
        <Typography>
          <Title>欢迎使用 Ant Design Pro 多标签页系统</Title>
          <Paragraph>基于蚂蚁金服Ant Design Pro二级开发，模拟Chrome浏览器标签管理</Paragraph>
          <Paragraph>
            1、支持多标签页 <br />
            2、支持单页面刷新 <br />
            3、支持关闭其他 <br />
            3、支持标签拖拽 <br />
          </Paragraph>

          <Divider />
        </Typography>
      </PageHeaderWrapper>
    );
  }
}

export default ReactBeautifulDndHorizontal;
