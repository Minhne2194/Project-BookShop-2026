import { useEffect, useState, type ImgHTMLAttributes } from 'react';

interface SafeImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
    src?: string | null;
    fallbackSrc?: string;
}

export function SafeImage({
    src,
    fallbackSrc = 'https://placehold.co/300x450/e2e8f0/64748b?text=Book+Cover',
    alt = 'Book Cover',
    className,
    ...props
}: SafeImageProps) {
    const [imgSrc, setImgSrc] = useState<string>(src || fallbackSrc);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setImgSrc(src || fallbackSrc);
        setHasError(false);
    }, [src, fallbackSrc]);

    const handleError = () => {
        if (!hasError) {
            setImgSrc(fallbackSrc);
            setHasError(true);
        }
    };

    return (
        <img
            src={imgSrc}
            alt={alt}
            onError={handleError}
            className={className}
            {...props}
        />
    );
}
