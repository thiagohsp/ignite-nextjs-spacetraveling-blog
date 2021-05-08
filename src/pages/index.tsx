import { GetStaticProps } from 'next';
import Link from 'next/link';
import Head from 'next/head';
import Prismic from '@prismicio/client';
import { FiCalendar, FiUser } from 'react-icons/fi';

import { useState } from 'react';
import { getPrismicClient } from '../services/prismic';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { formatDate } from '../util';
import Header from '../components/Header';

interface Post {
  uid: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [results, setResults] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState<string>(postsPagination.next_page);

  const handleNext = async (): Promise<void> => {
    const postsResponse = await fetch(nextPage).then(response => {
      return response.json();
    });

    const posts: Post[] = postsResponse.results.map(post => {
      return {
        uid: post.uid,
        data: {
          author: post.data.author,
          title: post.data.title,
          subtitle: post.data.subtitle,
        },
        first_publication_date: post.first_publication_date,
      };
    });

    setNextPage(postsResponse.next_page);

    setResults(prev => [...prev, ...posts]);
  };

  return (
    <>
      <Head>
        <title>Home | SpaceTraveling Blog</title>
      </Head>
      <Header />
      <div className={commonStyles.mainContainer}>
        <main className={styles.content}>
          <div className={styles.posts}>
            {results.length &&
              results.map(post => (
                <Link key={post.uid} href={`/post/${post.uid}`}>
                  <a>
                    <strong>{post.data.title}</strong>
                    <p>{post.data.subtitle}</p>
                    <div className={commonStyles.info}>
                      <span>
                        <FiCalendar size={20} />
                        {formatDate(new Date(post.first_publication_date))}
                      </span>
                      <span>
                        <FiUser size={20} />
                        {post.data.author}
                      </span>
                    </div>
                  </a>
                </Link>
              ))}
          </div>

          {nextPage && (
            <button type="button" onClick={handleNext}>
              Carregar mais posts
            </button>
          )}
        </main>
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
    }
  );

  const posts: Post[] = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      data: {
        author: post.data.author,
        title: post.data.title,
        subtitle: post.data.subtitle,
      },
      first_publication_date: post.first_publication_date,
    };
  });

  const postsPagination: PostPagination = {
    next_page: postsResponse.next_page || '',
    results: posts,
  };

  return {
    props: {
      postsPagination,
    },
  };
};
