package com.chwiyakhaenne.api;

import com.chwiyakhaenne.model.CodeFile;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class UploadFileReaderTest {

    private final UploadFileReader uploadFileReader = new UploadFileReader();

    @Test
    void readsSupportedPlainAndZipFiles() throws IOException {
        MockMultipartFile plainFile = new MockMultipartFile(
                "files",
                "src/app.js",
                "application/javascript",
                "console.log('test');".getBytes(StandardCharsets.UTF_8)
        );
        MockMultipartFile zipFile = new MockMultipartFile(
                "files",
                "project.zip",
                "application/zip",
                zipOf(
                        entry("frontend/../backend/src/Main.java", "class Main {}"),
                        entry("notes.txt", "ignore me")
                )
        );

        List<CodeFile> codeFiles = uploadFileReader.read(List.of(plainFile, zipFile));

        assertThat(codeFiles)
                .extracting(CodeFile::path)
                .containsExactly("src/app.js", "backend/src/Main.java");
        assertThat(codeFiles)
                .extracting(CodeFile::language)
                .containsExactly("JavaScript", "Java");
    }

    @Test
    void rejectsPlainFilePathTraversalAboveUploadRoot() {
        MockMultipartFile plainFile = new MockMultipartFile(
                "files",
                "../src/app.js",
                "application/javascript",
                "console.log('test');".getBytes(StandardCharsets.UTF_8)
        );

        assertThatThrownBy(() -> uploadFileReader.read(List.of(plainFile)))
                .isInstanceOf(IOException.class)
                .hasMessageContaining("path traversal");
    }

    @Test
    void rejectsZipEntryPathTraversalAboveArchiveRoot() throws IOException {
        MockMultipartFile zipFile = new MockMultipartFile(
                "files",
                "project.zip",
                "application/zip",
                zipOf(entry("../../src/app.js", "console.log('test');"))
        );

        assertThatThrownBy(() -> uploadFileReader.read(List.of(zipFile)))
                .isInstanceOf(IOException.class)
                .hasMessageContaining("path traversal");
    }

    @Test
    void rejectsTooManyMultipartParts() {
        List<MockMultipartFile> files = new java.util.ArrayList<>();
        for (int index = 0; index < 251; index++) {
            files.add(new MockMultipartFile(
                    "files",
                    "notes-" + index + ".txt",
                    "text/plain",
                    "ignore".getBytes(StandardCharsets.UTF_8)
            ));
        }

        assertThatThrownBy(() -> uploadFileReader.read(List.copyOf(files)))
                .isInstanceOf(IOException.class)
                .hasMessageContaining("too many files");
    }

    @Test
    void rejectsUploadWithoutSupportedSourceFiles() {
        MockMultipartFile plainFile = new MockMultipartFile(
                "files",
                "notes.txt",
                "text/plain",
                "ignore".getBytes(StandardCharsets.UTF_8)
        );

        assertThatThrownBy(() -> uploadFileReader.read(List.of(plainFile)))
                .isInstanceOf(IOException.class)
                .hasMessageContaining("supported source files");
    }

    @Test
    void rejectsOversizedZipEntry() throws IOException {
        MockMultipartFile zipFile = new MockMultipartFile(
                "files",
                "project.zip",
                "application/zip",
                zipOf(entry("src/huge.js", "a".repeat(2 * 1024 * 1024 + 1)))
        );

        assertThatThrownBy(() -> uploadFileReader.read(List.of(zipFile)))
                .isInstanceOf(IOException.class)
                .hasMessageContaining("ZIP entry exceeds");
    }

    @Test
    void rejectsOversizedPlainFile() {
        MockMultipartFile plainFile = new MockMultipartFile(
                "files",
                "src/huge.js",
                "application/javascript",
                "a".repeat(2 * 1024 * 1024 + 1).getBytes(StandardCharsets.UTF_8)
        );

        assertThatThrownBy(() -> uploadFileReader.read(List.of(plainFile)))
                .isInstanceOf(IOException.class)
                .hasMessageContaining("UPLOAD file exceeds");
    }

    @Test
    void rejectsOversizedZipUploadBeforeReadingArchive() {
        MockMultipartFile zipFile = new MockMultipartFile(
                "files",
                "project.zip",
                "application/zip",
                "a".repeat(2 * 1024 * 1024 + 1).getBytes(StandardCharsets.UTF_8)
        );

        assertThatThrownBy(() -> uploadFileReader.read(List.of(zipFile)))
                .isInstanceOf(IOException.class)
                .hasMessageContaining("UPLOAD file exceeds");
    }

    @Test
    void rejectsZipArchiveWhenSupportedTotalExceedsLimit() throws IOException {
        ZipEntryData[] entries = new ZipEntryData[11];
        for (int index = 0; index < 10; index++) {
            entries[index] = entry("src/file-" + index + ".js", "a".repeat(2 * 1024 * 1024));
        }
        entries[10] = entry("src/file-10.js", "b");

        MockMultipartFile zipFile = new MockMultipartFile(
                "files",
                "project.zip",
                "application/zip",
                zipOf(entries)
        );

        assertThatThrownBy(() -> uploadFileReader.read(List.of(zipFile)))
                .isInstanceOf(IOException.class)
                .hasMessageContaining("ZIP archive is too large");
    }

    @Test
    void rejectsUploadBatchWhenSupportedTotalExceedsLimit() {
        List<MockMultipartFile> files = new java.util.ArrayList<>();
        for (int index = 0; index < 10; index++) {
            files.add(new MockMultipartFile(
                    "files",
                    "src/file-" + index + ".js",
                    "application/javascript",
                    "a".repeat(2 * 1024 * 1024).getBytes(StandardCharsets.UTF_8)
            ));
        }
        files.add(new MockMultipartFile(
                "files",
                "src/file-10.js",
                "application/javascript",
                "b".repeat(1).getBytes(StandardCharsets.UTF_8)
        ));

        assertThatThrownBy(() -> uploadFileReader.read(List.copyOf(files)))
                .isInstanceOf(IOException.class)
                .hasMessageContaining("UPLOAD total supported content exceeds");
    }

    @Test
    void rejectsZipArchiveWithTooManyEntries() throws IOException {
        ZipEntryData[] entries = new ZipEntryData[2_001];
        for (int index = 0; index < entries.length; index++) {
            entries[index] = entry("src/file-" + index + ".js", "const ok = true;");
        }

        MockMultipartFile zipFile = new MockMultipartFile(
                "files",
                "project.zip",
                "application/zip",
                zipOf(entries)
        );

        assertThatThrownBy(() -> uploadFileReader.read(List.of(zipFile)))
                .isInstanceOf(IOException.class)
                .hasMessageContaining("too many files");
    }

    private static ZipEntryData entry(String name, String content) {
        return new ZipEntryData(name, content.getBytes(StandardCharsets.UTF_8));
    }

    private static byte[] zipOf(ZipEntryData... entries) throws IOException {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        try (ZipOutputStream zipOutputStream = new ZipOutputStream(outputStream, StandardCharsets.UTF_8)) {
            for (ZipEntryData entry : entries) {
                zipOutputStream.putNextEntry(new ZipEntry(entry.name()));
                zipOutputStream.write(entry.content());
                zipOutputStream.closeEntry();
            }
        }
        return outputStream.toByteArray();
    }

    private record ZipEntryData(String name, byte[] content) {
    }
}
