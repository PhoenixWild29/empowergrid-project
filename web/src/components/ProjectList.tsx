import React, { useState, useEffect } from 'react';
import { Project } from '../api';
import ProjectCard from './ProjectCard';

interface ProjectListProps {
  walletPublicKey: string | null;
}

const ProjectList: React.FC<ProjectListProps> = ({ walletPublicKey }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await import('../api').then(m => m.getProjects(walletPublicKey));
        setProjects(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [walletPublicKey]);

  if (loading) return <div style={{ color: 'white', textAlign: 'center' }}>Loading projects...</div>;
  if (error) return <div style={{ color: 'red', textAlign: 'center' }}>Error: {error}</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} walletPublicKey={walletPublicKey} />
      ))}
    </div>
  );
};

export default ProjectList;
