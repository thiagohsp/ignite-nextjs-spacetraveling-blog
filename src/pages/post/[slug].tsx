import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';

import { useRouter } from 'next/router';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import { formatDate } from '../../util';
import styles from './post.module.scss';
import Header from '../../components/Header';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  // If the page is not yet generated, this will be displayed
  // initially until getStaticProps() finishes running
  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  const { title, author, banner, content } = post.data;

  const { words } = content.reduce(
    (acc, cur) => {
      // const heading = RichText.asText(cur.heading);
      return {
        words:
          acc.words +
          RichText.asText(cur.body).split(/\s/g).length +
          cur.heading.split(/\s/g).length,
      };
    },
    { words: 0 }
  );

  const wordsPerMinute = 200;

  const minutes = words / wordsPerMinute;

  const readingTime = Math.ceil(minutes);

  return (
    <>
      <Head>
        <title>{`${title} | SpaceTraveling Blog`}</title>
      </Head>
      <Header />
      <div className={styles.banner}>
        <img src={banner.url} alt="" />
      </div>
      <main className={commonStyles.mainContainer}>
        <strong className={styles.postTitle}>{title}</strong>
        <div className={commonStyles.info}>
          <span>
            <FiCalendar size={20} />
            {formatDate(new Date(post.first_publication_date))}
          </span>
          <span>
            <FiUser size={20} />
            {author}
          </span>
          <span>
            <FiClock size={20} />
            {`${readingTime} min`}
          </span>
        </div>
        <div className={styles.postContent}>
          {content &&
            content.map(item => (
              <div key={item.heading}>
                <h1 key={item.heading}>{item.heading}</h1>
                <div
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(item.body),
                  }}
                />
              </div>
            ))}
        </div>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.uid'],
      pageSize: 100,
    }
  );

  // TODO
  return {
    paths: [...posts.results.map(post => ({ params: { slug: post.uid } }))],
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content,
    },
    uid: response.uid,
  };

  return {
    props: {
      post,
    },
  };
};
