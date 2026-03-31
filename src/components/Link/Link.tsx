import { type FC } from 'react';
import { Link as RouterLink, type LinkProps } from 'react-router-dom';

import { classNames } from '@/css/classnames.ts';

import './Link.css';

export const Link: FC<LinkProps> = ({
  className,
  ...rest
}) => {
  return (
    <RouterLink
      {...rest}
      className={classNames(className, 'link')}
    />
  );
};
