import {createSelector} from '@ngrx/store';
import {articleFeature} from './article.reducer';

export const {
  selectArticleState,
  selectComments,
  selectData,
  selectAuthors,
  selectLoaded,
  selectLoading
} = articleFeature;
export const getAuthorUsername = createSelector(selectData, (data) => data.author.username);

export const articleQuery = {
  selectArticleState,
  selectComments,
  selectData,
  selectAuthors,
  selectLoaded,
  selectLoading,
  getAuthorUsername,
};
