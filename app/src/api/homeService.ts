import client from './client';
import type {HomeStats} from '../types';

export function getHomeStats() {
  return client.get<{stats: HomeStats}>('/home/stats').then(res => res.data.stats);
}
