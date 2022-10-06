/* Copyright (c) 2020 Intel Corporation.

* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:

* The above copyright notice and this permission notice shall be included in
* all copies or substantial portions of the Software.

* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
*/

/* !

=========================================================
* Argon Dashboard React - v1.0.0
=========================================================

* Product Page: https://www.creative-tim.com/product/argon-dashboard-react
* Copyright 2019 Creative Tim (https://www.creative-tim.com)
* Licensed under MIT (https://github.com/creativetimofficial/argon-dashboard-react/blob/master/LICENSE.md)

* Coded by Creative Tim

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/

import Dashboard from './views/Dashboard/Dashboard';
import Datasets from 'views/Datasets/index';
import Dataset from 'views/Datasets/Dataset';
import CVATEmbedded from './views/Datasets/Annotation';
import Projects from './views/Projects/index';
import Project from './views/Projects/Project';
import DatasetSelection from './views/Projects/datasets/DatasetSelection';
import Visualizer from './views/Projects/visualizer/graph';
import UserGuide from './views/Documentation/userguide';
import FAQ from './views/Documentation/FAQ';

const routes = [
  {
    path: '/dashboard',
    name: 'Dashboard',
    icon: 'ni ni-tv-2 text-primary',
    component: Dashboard,
    layout: '/admin',
  },
  {
    path: '/datasets/:id/annotation/:fileId',
    name: 'Dataset',
    hide: true,
    component: CVATEmbedded,
    layout: '/admin',
  },
  {
    path: '/datasets/:id/annotation',
    name: 'Dataset',
    hide: true,
    component: CVATEmbedded,
    layout: '/admin',
  },

  {
    path: '/datasets/:id',
    name: 'Dataset',
    hide: true,
    component: Dataset,
    layout: '/admin',
  },

  {
    path: '/datasets',
    name: 'Datasets',
    icon: 'ni ni-folder-17 text-primary',
    exact: true,
    component: Datasets,
    layout: '/admin',
  },
  {
    path: '/projects/:id/dataSelection',
    name: 'DatasetSelection',
    hide: true,
    component: DatasetSelection,
    layout: '/admin',
  },
  {
    path: '/projects/:id/',
    name: 'Project',
    hide: true,
    component: Project,
    layout: '/admin',
  },
  {
    path: '/projects',
    name: 'Projects',
    icon: 'ni ni-bullet-list-67 text-primary',
    exact: true,
    component: Projects,
    layout: '/admin',
  },
  {
    path: '/job/:id/visualizer',
    name: 'Project',
    hide: true,
    component: Visualizer,
    layout: '/admin',
  },
  {
    path: '/tls-user-guide',
    name: 'User Guide',
    hide: true,
    component: UserGuide,
    layout: '/admin',
  },
  {
    path: '/tls-FAQ',
    name: 'Frequently Asked Question',
    hide: true,
    component: FAQ,
    layout: '/admin',
  },
];
export default routes;
