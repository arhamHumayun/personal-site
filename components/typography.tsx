import Link from 'next/link';
import React from 'react';

interface Props {
    className?: string;
    children: React.ReactNode;
}

const H1: React.FC<Props> = ({className, children}) => {
    return (
      <h1 className={`scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl ${className}`}>
        {children}
      </h1>
    )
  }

  const H2: React.FC<Props> = ({className, children}) => {
    return (
      <h2 className={`scroll-m-20 border-b pb-1 pt-4 text-3xl font-semibold tracking-tight first:mt-0 ${className}`}>
        {children}
      </h2>
    )
  }

  const H3: React.FC<Props> = ({className, children}) => {
    return (
      <h3 className={`scroll-m-20 text-2xl font-semibold tracking-tight ${className}`}>
        {children}
      </h3>
    )
  }
  

  const H4: React.FC<Props> = ({className, children}) => {
    return (
      <h4 className={`scroll-m-20 text-xl font-semibold tracking-tight ${className}`}>
        {children}
      </h4>
    )
  }
  

  const P: React.FC<Props> = ({className, children}) => {
    return (
      <p className={`leading-7 [&:not(:first-child)]:mt-4 ${className}`}>
       {children}
      </p>
    )
  }
  

  const Blockquote: React.FC<Props> = ({className, children}) => {
    return (
      <blockquote className={`mt-6 border-l-2 pl-6 italic ${className}`}>
        {children}
      </blockquote>
    )
  }
  

  const InlineCode: React.FC<Props> = ({className, children}) => {
    return (
      <code className={`relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold ${className}`}>
        {children}
      </code>
    )
  }
  

  const Lead: React.FC<Props> = ({className, children}) => {
    return (
      <p className={`text-xl text-muted-foreground ${className}`}>
        {children}
      </p>
    )
  }
  

  const Large: React.FC<Props> = ({className, children}) => {
    return <div className={`text-lg font-semibold ${className}`}>{children}</div>
  }
  

  const Muted: React.FC<Props> = ({className, children}) => {
    return (
      <p className={`text-sm text-muted-foreground ${className}`}>{children}.</p>
    )
  }
  

  const A: React.FC<Props & { href?: string }> = ({ className, children, href }) => {
    return (
      <Link
        prefetch={true}
        href={href || '#'}
        className={`font-medium text-primary underline ${className}`}
      >
        {children}
      </Link>
    );
  };

  const UL: React.FC<Props> = ({ className, children }) => {
    return (
      <ul className={`my-6 ml-6 list-disc [&>li]:mt-2 ${className}`}>
        {children}
      </ul>
    );
  };

  const LI: React.FC<Props> = ({ className, children }) => {
    return (
      <li className={`${className}`}>
        {children}
      </li>
    );
  };

  const Table: React.FC<Props> = ({ className, children }) => {
    return (
      <div className={`my-6 w-full overflow-y-auto ${className}`}>
        <table className={`w-full`}>
          {children}
        </table>
      </div>
    );
  };

  const Thead: React.FC<Props> = ({ className, children }) => {
    return (
      <thead className={`${className}`}>
        {children}
      </thead>
    );
  };

  const Tbody: React.FC<Props> = ({ className, children }) => {
    return (
      <tbody className={`${className}`}>
        {children}
      </tbody>
    );
  };

  const Tr: React.FC<Props> = ({ className, children }) => {
    return (
      <tr className={`m-0 border-t p-0 even:bg-muted ${className}`}>
        {children}
      </tr>
    );
  };

  const Th: React.FC<Props & { align?: 'left' | 'center' | 'right' }> = ({ className, children, align }) => {
    const alignmentClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
    return (
      <th className={`border px-4 py-2 font-bold [&[align=center]]:text-center [&[align=right]]:text-right ${alignmentClass} ${className}`}>
        {children}
      </th>
    );
  };

  const Td: React.FC<Props & { align?: 'left' | 'center' | 'right' }> = ({ className, children, align }) => {
    const alignmentClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
    return (
      <td className={`border px-4 py-2 [&[align=center]]:text-center [&[align=right]]:text-right ${alignmentClass} ${className}`}>
        {children}
      </td>
    );
  };
  
  export { H1, H2, H3, H4, P, Lead, Large, Muted, Blockquote, InlineCode, A, UL, LI, Table, Thead, Tbody, Tr, Th, Td }