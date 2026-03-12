"use client";

import React, { useState } from 'react';

type SafeImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
    fallbackSrc?: string;
};

export default function SafeImage({
    src,
    fallbackSrc = 'https://via.placeholder.com/300x420?text=No+Image',
    alt,
    ...props
}: SafeImageProps) {
    const [imgSrc, setImgSrc] = useState(src);

    return (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
            {...props}
            src={imgSrc}
            alt={alt}
            onError={() => {
                setImgSrc(fallbackSrc);
            }}
        />
    );
}
