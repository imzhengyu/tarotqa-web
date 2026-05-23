// 导出工具函数 - PNG 图片导出
import html2canvas from 'html2canvas';

export async function exportToPNG(elementId, filename = 'export') {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('导出元素未找到');
  }

  // 等待字体加载完成
  await document.fonts.ready;

  const canvas = await html2canvas(element, {
    backgroundColor: '#1a1a2e',
    scale: 2,
    useCORS: true,
    logging: false
  });

  const link = document.createElement('a');
  link.download = `${filename}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
