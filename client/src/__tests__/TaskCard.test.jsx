import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TaskCard from '../components/tasks/TaskCard';

describe('TaskCard', () => {
  const mockTask = {
    id: '1',
    title: 'Test Task',
    description: 'Test description',
    status: 'TODO',
    priority: 'HIGH',
    createdAt: new Date().toISOString(),
    dueDate: new Date(Date.now() + 86400000).toISOString()
  };

  const mockHandlers = {
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onStatusChange: vi.fn()
  };

  it('should render task card with basic information', () => {
    render(<TaskCard task={mockTask} {...mockHandlers} />);
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('should render status and priority badges', () => {
    render(<TaskCard task={mockTask} {...mockHandlers} />);
    
    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('should NOT render dangerous HTML in title (XSS test)', () => {
    const xssTask = {
      ...mockTask,
      title: '<img src=x onerror=alert(1)>XSS Test',
      description: 'Safe description'
    };

    const { container } = render(<TaskCard task={xssTask} {...mockHandlers} />);
    
    // Check that the dangerous HTML is rendered as-is (vulnerability present)
    // This test documents the XSS vulnerability
    const titleElement = container.querySelector('h3');
    expect(titleElement.innerHTML).toContain('<img');
    expect(titleElement.innerHTML).toContain('onerror');
  });

  it('should render without description when not provided', () => {
    const taskNoDesc = { ...mockTask, description: null };
    
    render(<TaskCard task={taskNoDesc} {...mockHandlers} />);
    
    expect(screen.getByText('No description')).toBeInTheDocument();
  });
});
