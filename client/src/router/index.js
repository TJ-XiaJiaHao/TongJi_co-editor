import Vue from 'vue';
import Router from 'vue-router';
import HelloWorld from '@/components/HelloWorld';
import Ace from '@/components/Ace';

Vue.use(Router);

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'HelloWorld',
      component: Ace
    },
    {
      path: '/ace',
      name: 'AceDemo',
      component: Ace
    },
    {
      path: '/index',
      name: 'Index',
      component: HelloWorld
    }
  ]
});
