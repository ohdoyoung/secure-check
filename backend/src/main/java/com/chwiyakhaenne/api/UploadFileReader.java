package com.chwiyakhaenne.api;

import com.chwiyakhaenne.analyzer.LanguageDetector;
import com.chwiyakhaenne.model.CodeFile;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Deque;
import java.util.ArrayDeque;
import java.util.List;
import java.util.Locale;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@Component
public class UploadFileReader {

    private static final int MAX_UPLOAD_PARTS = 250;
    private static final int MAX_ANALYZED_FILES = 2_000;
    private static final int MAX_ZIP_ENTRIES = 2_000;
    private static final int MAX_ENTRY_BYTES = 2 * 1024 * 1024;
    private static final int MAX_TOTAL_BYTES = 20 * 1024 * 1024;
    private static final int MAX_PATH_LENGTH = 500;
    private static final long MAX_ZIP_COMPRESSION_RATIO = 100;

    public List<CodeFile> read(List<MultipartFile> files) throws IOException {
        if (files == null || files.isEmpty()) {
            throw new IOException("UPLOAD does not contain files.");
        }
        if (files.size() > MAX_UPLOAD_PARTS) {
            throw new IOException("UPLOAD contains too many files.");
        }
        List<CodeFile> codeFiles = new ArrayList<>();
        int totalBytes = 0;
        for (MultipartFile file : files) {
            String fileName = safePath(file.getOriginalFilename(), "UPLOAD");
            ensureEntryWithinLimit(file.getSize(), "UPLOAD file exceeds the maximum supported size.");
            if (fileName.toLowerCase(Locale.ROOT).endsWith(".zip")) {
                ReadBatch zipBatch = readZip(file.getBytes());
                totalBytes = addToTotalBytes(totalBytes, zipBatch.totalBytes(), "UPLOAD total supported content exceeds the maximum allowed size.");
                ensureAnalyzedFileCount(codeFiles.size() + zipBatch.codeFiles().size());
                codeFiles.addAll(zipBatch.codeFiles());
                continue;
            }
            if (LanguageDetector.isSupported(fileName)) {
                byte[] content = file.getBytes();
                ensureEntryWithinLimit(content.length, "UPLOAD file exceeds the maximum supported size.");
                totalBytes = addToTotalBytes(totalBytes, content.length, "UPLOAD total supported content exceeds the maximum allowed size.");
                ensureAnalyzedFileCount(codeFiles.size() + 1);
                codeFiles.add(new CodeFile(
                        fileName,
                        LanguageDetector.detect(fileName, null),
                        new String(content, StandardCharsets.UTF_8)
                ));
            }
        }
        if (codeFiles.isEmpty()) {
            throw new IOException("UPLOAD does not contain supported source files.");
        }
        return codeFiles;
    }

    private ReadBatch readZip(byte[] bytes) throws IOException {
        List<CodeFile> codeFiles = new ArrayList<>();
        int totalBytes = 0;
        int entryCount = 0;
        try (ZipInputStream zipInputStream = new ZipInputStream(new ByteArrayInputStream(bytes), StandardCharsets.UTF_8)) {
            ZipEntry entry;
            while ((entry = zipInputStream.getNextEntry()) != null) {
                if (entry.isDirectory()) {
                    continue;
                }
                entryCount++;
                if (entryCount > MAX_ZIP_ENTRIES) {
                    throw new IOException("ZIP archive contains too many files.");
                }
                ensureZipEntryMetadataIsSafe(entry);
                String path = safePath(entry.getName(), "ZIP");
                if (!LanguageDetector.isSupported(path)) {
                    continue;
                }
                byte[] content = readEntryBytes(zipInputStream);
                totalBytes = addToTotalBytes(totalBytes, content.length, "ZIP archive is too large to analyze.");
                ensureAnalyzedFileCount(codeFiles.size() + 1);
                codeFiles.add(new CodeFile(
                        path,
                        LanguageDetector.detect(path, null),
                        new String(content, StandardCharsets.UTF_8)
                ));
            }
        }
        return new ReadBatch(codeFiles, totalBytes);
    }

    private void ensureZipEntryMetadataIsSafe(ZipEntry entry) throws IOException {
        long declaredSize = entry.getSize();
        if (declaredSize > MAX_ENTRY_BYTES) {
            throw new IOException("ZIP entry exceeds the maximum supported size.");
        }
        long compressedSize = entry.getCompressedSize();
        if (declaredSize > 0 && compressedSize > 0 && declaredSize / compressedSize > MAX_ZIP_COMPRESSION_RATIO) {
            throw new IOException("ZIP compression ratio is too high.");
        }
    }

    private byte[] readEntryBytes(ZipInputStream zipInputStream) throws IOException {
        LimitedByteArrayOutputStream outputStream = new LimitedByteArrayOutputStream(MAX_ENTRY_BYTES);
        zipInputStream.transferTo(outputStream);
        return outputStream.toByteArray();
    }

    private void ensureEntryWithinLimit(long bytes, String message) throws IOException {
        if (bytes > MAX_ENTRY_BYTES) {
            throw new IOException(message);
        }
    }

    private void ensureAnalyzedFileCount(int fileCount) throws IOException {
        if (fileCount > MAX_ANALYZED_FILES) {
            throw new IOException("UPLOAD contains too many supported source files.");
        }
    }

    private int addToTotalBytes(int currentTotal, int nextBytes, String message) throws IOException {
        int updatedTotal = currentTotal + nextBytes;
        if (updatedTotal > MAX_TOTAL_BYTES) {
            throw new IOException(message);
        }
        return updatedTotal;
    }

    private String safePath(String name, String source) throws IOException {
        if (name == null || name.isBlank()) {
            return "unknown.txt";
        }
        if (name.indexOf('\0') >= 0) {
            throw new IOException(source + " path contains an invalid character.");
        }
        String normalized = name.trim().replace("\\", "/");
        if (normalized.startsWith("/") || normalized.matches("(?i)^[a-z]:.*")) {
            throw new IOException(source + " absolute paths are not allowed.");
        }
        String[] segments = normalized.split("/");
        Deque<String> safeSegments = new ArrayDeque<>();
        for (String segment : segments) {
            if (segment.isBlank() || ".".equals(segment)) {
                continue;
            }
            if ("..".equals(segment)) {
                if (!safeSegments.isEmpty()) {
                    safeSegments.removeLast();
                    continue;
                }
                throw new IOException(source + " path traversal is not allowed.");
            }
            safeSegments.addLast(segment);
        }
        if (safeSegments.isEmpty()) {
            return "unknown.txt";
        }
        String path = String.join("/", safeSegments);
        if (path.length() > MAX_PATH_LENGTH) {
            throw new IOException(source + " path is too long.");
        }
        return path;
    }

    private static final class LimitedByteArrayOutputStream extends OutputStream {

        private final int maxBytes;
        private final java.io.ByteArrayOutputStream delegate = new java.io.ByteArrayOutputStream();
        private int written;

        private LimitedByteArrayOutputStream(int maxBytes) {
            this.maxBytes = maxBytes;
        }

        @Override
        public void write(int b) throws IOException {
            ensureCapacity(1);
            delegate.write(b);
            written++;
        }

        @Override
        public void write(byte[] b, int off, int len) throws IOException {
            ensureCapacity(len);
            delegate.write(b, off, len);
            written += len;
        }

        private void ensureCapacity(int nextBytes) throws IOException {
            if (written + nextBytes > maxBytes) {
                throw new IOException("ZIP entry exceeds the maximum supported size.");
            }
        }

        private byte[] toByteArray() {
            return delegate.toByteArray();
        }
    }

    private record ReadBatch(List<CodeFile> codeFiles, int totalBytes) {
    }
}
