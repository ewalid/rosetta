import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSheets, translateFile, submitFeedback } from './client';

describe('API Client', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('getSheets', () => {
    it('returns sheets on success', async () => {
      const mockSheets = ['Sheet1', 'Sheet2', 'Sheet3'];
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ sheets: mockSheets }),
      } as Response);

      const file = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const result = await getSheets(file);

      expect(result.success).toBe(true);
      expect(result.sheets).toEqual(mockSheets);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sheets'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('returns error on failure', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ detail: 'Invalid file type' }),
      } as Response);

      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const result = await getSheets(file);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid file type');
    });

    it('handles network errors', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

      const file = new File(['test'], 'test.xlsx');
      const result = await getSheets(file);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('translateFile', () => {
    it('returns blob on success', async () => {
      const mockBlob = new Blob(['translated content'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      } as Response);

      const file = new File(['test'], 'test.xlsx');
      const result = await translateFile({
        file,
        targetLanguage: 'french',
      });

      expect(result.success).toBe(true);
      expect(result.blob).toBe(mockBlob);
      expect(result.filename).toBe('test_french.xlsx');
    });

    it('sends optional parameters when provided', async () => {
      const mockBlob = new Blob(['translated']);
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      } as Response);

      const file = new File(['test'], 'data.xlsx');
      await translateFile({
        file,
        targetLanguage: 'spanish',
        sourceLanguage: 'english',
        context: 'Medical terminology',
        sheets: ['Sheet1', 'Sheet2'],
      });

      const fetchCall = vi.mocked(global.fetch).mock.calls[0];
      const formData = fetchCall[1]?.body as FormData;

      expect(formData.get('target_lang')).toBe('spanish');
      expect(formData.get('source_lang')).toBe('english');
      expect(formData.get('context')).toBe('Medical terminology');
      expect(formData.get('sheets')).toBe('Sheet1,Sheet2');
    });

    it('returns error on failure', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ detail: 'Translation failed' }),
      } as Response);

      const file = new File(['test'], 'test.xlsx');
      const result = await translateFile({
        file,
        targetLanguage: 'french',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Translation failed');
    });

    it('handles network errors', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Connection refused'));

      const file = new File(['test'], 'test.xlsx');
      const result = await translateFile({
        file,
        targetLanguage: 'german',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection refused');
    });
  });

  describe('submitFeedback', () => {
    it('submits feedback successfully', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, message: 'Feedback submitted' }),
      } as Response);

      const result = await submitFeedback({
        rating: 5,
        improvements: ['Translation quality', 'Speed/Performance'],
        additionalFeedback: 'Great tool!',
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Feedback submitted');

      const fetchCall = vi.mocked(global.fetch).mock.calls[0];
      expect(fetchCall[0]).toContain('/feedback');
      expect(fetchCall[1]?.headers).toEqual({ 'Content-Type': 'application/json' });

      const body = JSON.parse(fetchCall[1]?.body as string);
      expect(body.rating).toBe(5);
      expect(body.improvements).toEqual(['Translation quality', 'Speed/Performance']);
      expect(body.additional_feedback).toBe('Great tool!');
    });

    it('submits minimal feedback', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);

      const result = await submitFeedback({
        rating: 3,
        improvements: [],
      });

      expect(result.success).toBe(true);

      const fetchCall = vi.mocked(global.fetch).mock.calls[0];
      const body = JSON.parse(fetchCall[1]?.body as string);
      expect(body.additional_feedback).toBeUndefined();
    });

    it('handles server errors', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: () => Promise.resolve({ detail: 'Invalid rating' }),
      } as Response);

      const result = await submitFeedback({
        rating: 5,
        improvements: [],
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid rating');
    });

    it('handles network errors', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network failure'));

      const result = await submitFeedback({
        rating: 4,
        improvements: ['User interface'],
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network failure');
    });
  });
});
